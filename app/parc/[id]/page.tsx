"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Truck,
  Calendar,
  Clock,
  AlertTriangle,
  Wrench,
  MapPin,
  Euro,
  FileText,
  CheckCircle2,
  Loader2,
  Shield,
  Gauge,
  Thermometer,
} from "lucide-react";
import { supabase, type Vehicle, type Intervention, VEHICLE_CONTROLS } from "@/lib/supabase";
import { toast } from "sonner";
import { differenceInDays, isPast, parseISO, format, parse, isValid } from "date-fns";
import { fr } from "date-fns/locale";

// Helper pour le statut de date
function getDateStatus(dateString: string | null): {
  variant: "destructive" | "default" | "secondary" | "outline";
  className: string;
  label: string;
  icon: ReactNode;
} {
  if (!dateString) {
    return {
      variant: "outline",
      className: "border-slate-300 text-slate-500",
      label: "Non defini",
      icon: null,
    };
  }

  const date = parseISO(dateString);
  const today = new Date();
  const daysUntil = differenceInDays(date, today);

  if (isPast(date) || daysUntil < 0) {
    return {
      variant: "destructive",
      className: "",
      label: `EXPIRE (${Math.abs(daysUntil)}j)`,
      icon: <AlertTriangle className="w-3 h-3" />,
    };
  }

  if (daysUntil < 7) {
    return {
      variant: "destructive",
      className: "",
      label: `${daysUntil}j restants`,
      icon: <AlertTriangle className="w-3 h-3" />,
    };
  }

  if (daysUntil < 30) {
    return {
      variant: "default",
      className: "bg-orange-500 hover:bg-orange-600",
      label: `${daysUntil}j restants`,
      icon: <Clock className="w-3 h-3" />,
    };
  }

  return {
    variant: "secondary",
    className: "bg-green-100 text-green-800",
    label: `${daysUntil}j restants`,
    icon: <CheckCircle2 className="w-3 h-3" />,
  };
}

// Helper pour le statut intervention
function getInterventionStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return { label: "En attente", className: "bg-orange-500 text-white" };
    case "approved_waiting_rdv":
      return { label: "RDV a planifier", className: "bg-blue-500 text-white" };
    case "planned":
      return { label: "Planifie", className: "bg-green-600 text-white" };
    case "completed":
      return { label: "Termine", className: "bg-slate-500 text-white" };
    default:
      return { label: status, className: "bg-slate-300" };
  }
}
function safeFormatInterventionDate(intervention: any) {
  if (intervention.created_at) {
    const d = new Date(intervention.created_at);
    if (!isNaN(d.getTime())) return format(d, "dd/MM/yyyy");
  }

  if (intervention.date_creation) {
    const isoTry = parseISO(intervention.date_creation);
    if (isValid(isoTry)) return format(isoTry, "dd/MM/yyyy");

    const frTry = parse(intervention.date_creation, "dd/MM/yyyy", new Date());
    if (isValid(frTry)) return format(frTry, "dd/MM/yyyy");

    return intervention.date_creation;
  }

  return "-";
}

function safeFormatRdvDate(rdvDate: any) {
  if (!rdvDate) return null;
  const d = new Date(rdvDate);
  if (isNaN(d.getTime())) return null;
  return format(d, "dd/MM HH:mm");
}
/* ✅ FIN AJOUT */

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les donnees
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Charger le vehicule
        const { data: vehicleData, error: vehicleError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", vehicleId)
          .single();

        if (vehicleError) throw vehicleError;
        setVehicle(vehicleData);

        // Charger les interventions du vehicule
        const { data: interventionsData, error: interventionsError } = await supabase
          .from("interventions")
          .select("*")
          .eq("vehicle_id", vehicleId)
          .order("created_at", { ascending: false });

        if (interventionsError) throw interventionsError;
        setInterventions(interventionsData || []);

      } catch (error: any) {
        console.error("Erreur chargement:", error);
        toast.error("Erreur de chargement", {
          description: error?.message,
        });
      } finally {
        setLoading(false);
      }
    }

    if (vehicleId) {
      fetchData();
    }
  }, [vehicleId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        <p className="ml-3 text-slate-600">Chargement...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-20">
        <Truck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Vehicule non trouve</h2>
        <p className="text-slate-500 mt-2">Ce vehicule n'existe pas ou a ete supprime.</p>
        <Button variant="outline" className="mt-6" onClick={() => router.push("/parc")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour au parc
        </Button>
      </div>
    );
  }

  const controls = VEHICLE_CONTROLS[vehicle.type] || {
    requiresCT: true,
    requiresTachy: true,
    requiresATP: true,
  };

  const ctStatus = getDateStatus(vehicle.date_ct);
  const tachyStatus = getDateStatus(vehicle.date_tachy);
  const atpStatus = getDateStatus(vehicle.date_atp);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/parc")}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900 font-mono">
                {vehicle.immat}
              </h1>
              <Badge variant="outline" className="text-sm font-medium">
                {vehicle.type}
              </Badge>
              <Badge
                variant="outline"
                className={
                  vehicle.status === "actif"
                    ? "border-green-300 bg-green-50 text-green-700"
                    : vehicle.status === "maintenance"
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-slate-300 bg-slate-50 text-slate-700"
                }
              >
                {vehicle.status}
              </Badge>
            </div>
            <p className="text-slate-600 mt-1">{vehicle.marque}</p>
          </div>
        </div>
      </div>

      {/* Layout 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colonne gauche: Infos vehicule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-slate-600" />
              Informations vehicule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Immatriculation</p>
                <p className="text-lg font-bold font-mono text-blue-600">{vehicle.immat}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-1">Type</p>
                <p className="text-lg font-semibold">{vehicle.type}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg col-span-2">
                <p className="text-sm text-slate-500 mb-1">Marque / Modele</p>
                <p className="text-lg font-semibold">{vehicle.marque}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-slate-500 mb-3">Controles requis pour ce type</p>
              <div className="flex flex-wrap gap-2">
                {controls.requiresCT && (
                  <Badge variant="outline" className="gap-1">
                    <Shield className="w-3 h-3" />
                    CT annuel
                  </Badge>
                )}
                {controls.requiresTachy && (
                  <Badge variant="outline" className="gap-1">
                    <Gauge className="w-3 h-3" />
                    Tachygraphe
                  </Badge>
                )}
                {controls.requiresATP && (
                  <Badge variant="outline" className="gap-1">
                    <Thermometer className="w-3 h-3" />
                    ATP
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colonne droite: Echeances */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              Echeances
            </CardTitle>
            <CardDescription>
              Dates de validite des controles reglementaires
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CT annuel */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Shield className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">CT annuel</p>
                  <p className="text-sm text-slate-500">
                    {vehicle.date_ct
                      ? format(parseISO(vehicle.date_ct), "d MMMM yyyy", { locale: fr })
                      : "Non defini"}
                  </p>
                </div>
              </div>
              <Badge variant={ctStatus.variant} className={ctStatus.className}>
                {ctStatus.icon}
                <span className="ml-1">{ctStatus.label}</span>
              </Badge>
            </div>

            {/* Tachygraphe */}
            {controls.requiresTachy && (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Gauge className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Tachygraphe</p>
                    <p className="text-sm text-slate-500">
                      {vehicle.date_tachy
                        ? format(parseISO(vehicle.date_tachy), "d MMMM yyyy", { locale: fr })
                        : "Non defini"}
                    </p>
                  </div>
                </div>
                <Badge variant={tachyStatus.variant} className={tachyStatus.className}>
                  {tachyStatus.icon}
                  <span className="ml-1">{tachyStatus.label}</span>
                </Badge>
              </div>
            )}

            {/* ATP */}
            {controls.requiresATP && (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Thermometer className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">ATP (Frigo)</p>
                    <p className="text-sm text-slate-500">
                      {vehicle.date_atp
                        ? format(parseISO(vehicle.date_atp), "d MMMM yyyy", { locale: fr })
                        : "Non defini"}
                    </p>
                  </div>
                </div>
                <Badge variant={atpStatus.variant} className={atpStatus.className}>
                  {atpStatus.icon}
                  <span className="ml-1">{atpStatus.label}</span>
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Interventions / Details */}
      <Tabs defaultValue="interventions" className="w-full">
        <TabsList>
          <TabsTrigger value="interventions" className="gap-2">
            <Wrench className="w-4 h-4" />
            Interventions ({interventions.length})
          </TabsTrigger>
          <TabsTrigger value="details" className="gap-2">
            <FileText className="w-4 h-4" />
            Details
          </TabsTrigger>
        </TabsList>

        {/* Tab Interventions */}
        <TabsContent value="interventions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des interventions</CardTitle>
              <CardDescription>
                Toutes les interventions de maintenance pour ce vehicule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interventions.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Aucune intervention</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Les interventions de maintenance apparaitront ici
                  </p>
                  <Button variant="outline" className="mt-6" asChild>
                    <Link href="/maintenance">
                      Creer une demande
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Lieu / Garage</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {interventions.map((intervention) => {
                        const statusBadge = getInterventionStatusBadge(intervention.status);
                        return (
                          <TableRow key={intervention.id} className="hover:bg-slate-50">
                           <TableCell>
                              <div>
                                  <p className="font-medium">{safeFormatInterventionDate(intervention)}</p>

                                      {intervention.rdv_date && (
                                        <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                          <Calendar className="w-3 h-3" />
                                          RDV: {safeFormatRdvDate(intervention.rdv_date) || "-"}
                                        </p>
                                      )}
                              </div>
                            </TableCell>

                            <TableCell>
                              <p className="font-medium text-slate-900">
                                {intervention.description}
                              </p>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusBadge.className}>
                                {statusBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                                <span className="text-sm text-slate-600">
                                  {intervention.rdv_lieu || intervention.garage || "-"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold">
                                {(intervention.montant || 0).toLocaleString()} EUR
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Details */}
        <TabsContent value="details" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Details techniques</CardTitle>
              <CardDescription>
                Informations complementaires sur le vehicule
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Identifiant unique</p>
                    <p className="font-mono text-sm text-slate-700">{vehicle.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Date d'ajout au parc</p>
                    <p className="font-medium">
                      {vehicle.created_at
                        ? format(parseISO(vehicle.created_at), "d MMMM yyyy 'a' HH:mm", { locale: fr })
                        : "Non disponible"}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-500">Nombre total d'interventions</p>
                    <p className="text-2xl font-bold">{interventions.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Cout total maintenance</p>
                    <p className="text-2xl font-bold">
                      {interventions.reduce((sum, i) => sum + (i.montant || 0), 0).toLocaleString()} EUR
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
