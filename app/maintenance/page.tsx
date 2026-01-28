"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, type Intervention } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { Check, X, Plus, Wrench, Building2, Euro, Calendar, History } from "lucide-react";
import { toast } from "sonner";
import { type InterventionStatus, INTERVENTIONS as MOCK_INTERVENTIONS } from "@/lib/data";
import { RoleSwitcher, useRole } from "@/components/RoleSwitcher";
import { getPermissions } from "@/lib/role";

type VehicleLite = {
  id: string;
  immat: string;
  marque?: string | null;
  type?: string | null;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Fonction helper pour obtenir les infos du badge de statut
function getStatusBadge(status: InterventionStatus) {
  switch (status) {
    case "pending":
      return {
        label: "En attente validation",
        variant: "default" as const,
        className: "bg-orange-500 hover:bg-orange-600 text-white",
      };
    case "approved_waiting_rdv":
      return {
        label: "Validé - RDV à planifier",
        variant: "default" as const,
        className: "bg-blue-500 hover:bg-blue-600 text-white",
      };
    case "planned":
      return {
        label: "RDV planifié",
        variant: "default" as const,
        className: "bg-green-600 hover:bg-green-700 text-white",
      };
    case "completed":
      return {
        label: "Terminé",
        variant: "secondary" as const,
        className: "bg-slate-500 text-white",
      };
    default:
      return {
        label: String(status),
        variant: "secondary" as const,
        className: "bg-slate-300 text-slate-900",
      };
  }
}

export default function MaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "all";

  const { role, setRole } = useRole();
  const permissions = getPermissions(role);

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [vehicles, setVehicles] = useState<VehicleLite[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  // Form Nouvelle Demande
  const [newVehicule, setNewVehicule] = useState("");
  const [newImmat, setNewImmat] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newGarage, setNewGarage] = useState("");
  const [newMontant, setNewMontant] = useState<string>("0");
  const [newVehicleId, setNewVehicleId] = useState<string | null>(null);

  // Modal RDV
  const [rdvModalOpen, setRdvModalOpen] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [rdvDate, setRdvDate] = useState("");
  const [rdvTime, setRdvTime] = useState("");
  const [rdvLieu, setRdvLieu] = useState("");

  // Detail sheet
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailIntervention, setDetailIntervention] = useState<Intervention | null>(null);

  // Charger les véhicules (pour lier vehicle_id)
  const fetchVehicles = useCallback(async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, immat, marque, type")
      .order("immat", { ascending: true });

    if (error) {
      console.error("Erreur chargement vehicles:", error);
      return;
    }
    setVehicles((data || []) as VehicleLite[]);
  }, []);

  // Charger les interventions depuis Supabase (fallback mock si erreur)
  const fetchInterventions = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("interventions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erreur Supabase:", error);

        // Fallback sur données mock
        const mockData = MOCK_INTERVENTIONS.map((m: any) => ({
          ...m,
          date_creation: m.dateCreation,
        }));
        setInterventions(mockData as unknown as Intervention[]);
        toast.error("DB non disponible - Mode démo");
        return;
      }

      if (!data || data.length === 0) {
        setInterventions([]);
        // toast.info("Aucune intervention en base"); // optionnel
      } else {
        setInterventions(data as Intervention[]);
      }
    } catch (err: any) {
      console.error("Erreur chargement interventions:", err);
      const mockData = MOCK_INTERVENTIONS.map((m: any) => ({
        ...m,
        date_creation: m.dateCreation,
      }));
      setInterventions(mockData as unknown as Intervention[]);
      toast.error("Erreur de chargement - Mode démo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchInterventions();
  }, [fetchVehicles, fetchInterventions]);

  // Auto-match vehicle_id à partir de l'immat saisie
  const matchedVehicle = useMemo(() => {
    const immat = newImmat.trim();
    if (!immat) return null;
    return vehicles.find((v) => v.immat?.toLowerCase() === immat.toLowerCase()) || null;
  }, [newImmat, vehicles]);

  useEffect(() => {
    if (matchedVehicle) {
      setNewVehicleId(matchedVehicle.id);

      // Auto-remplir "Véhicule" si vide
      if (!newVehicule.trim()) {
        const label = [matchedVehicle.marque, matchedVehicle.type].filter(Boolean).join(" - ");
        setNewVehicule(label || "");
      }
    } else {
      setNewVehicleId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedVehicle]);

  // Statistiques
  const pendingCount = interventions.filter((i: any) => i.status === "pending").length;
  const waitingRdvCount = interventions.filter((i: any) => i.status === "approved_waiting_rdv").length;
  const plannedCount = interventions.filter((i: any) => i.status === "planned").length;
  const completedCount = interventions.filter((i: any) => i.status === "completed").length;

  // Filtrer selon l'onglet
  const getFilteredInterventions = () => {
    switch (activeTab) {
      case "validation":
        return interventions.filter((i: any) => i.status === "pending");
      case "planning":
        return interventions.filter((i: any) => i.status === "approved_waiting_rdv");
      case "planned":
        return interventions.filter((i: any) => i.status === "planned");
      case "history":
        return interventions.filter((i: any) => i.status === "completed");
      default:
        return interventions.filter((i: any) => i.status !== "completed");
    }
  };

  // Créer une intervention (EN BASE)
  const handleCreateIntervention = async () => {
    try {
      const vehicule = newVehicule.trim();
      const immat = newImmat.trim();
      const description = newDescription.trim();
      const garage = newGarage.trim();

      if (!vehicule || !immat || !description || !garage) {
        toast.error("Veuillez remplir tous les champs");
        return;
      }

      const montantNumber = Number(newMontant || 0);
      if (Number.isNaN(montantNumber) || montantNumber < 0) {
        toast.error("Montant invalide");
        return;
      }

      const payload: any = {
        vehicule,
        immat,
        description,
        garage,
        montant: montantNumber,
        status: "pending" as InterventionStatus,
        date_creation: new Date().toISOString(), // IMPORTANT: ISO (compatible parseISO partout)
        vehicle_id: newVehicleId, // peut être null si immat inconnue
      };

      const { data, error } = await supabase
        .from("interventions")
        .insert(payload)
        .select("*")
        .single();

      if (error) throw error;

      setInterventions((prev) => [data as Intervention, ...prev]);

      toast.success("Demande créée", {
        description: newVehicleId
          ? "Intervention enregistrée et liée au véhicule"
          : "Intervention enregistrée (immat non trouvée dans le parc, non liée)",
      });

      // Reset + fermeture
      setIsDialogOpen(false);
      setNewVehicule("");
      setNewImmat("");
      setNewDescription("");
      setNewGarage("");
      setNewMontant("0");
      setNewVehicleId(null);
    } catch (err: any) {
      console.error("Erreur création intervention:", err);
      toast.error("Impossible de créer l'intervention", { description: err?.message });
    }
  };

  // Action de validation devis (directeur uniquement)
  const handleApproveDevis = async (id: string) => {
    if (!UUID_REGEX.test(id)) {
      toast.error("Mode démo : action non disponible", {
        description: "Créez des interventions dans Supabase pour utiliser cette fonctionnalité",
      });
      return;
    }

    const { error } = await supabase
      .from("interventions")
      .update({ status: "approved_waiting_rdv" })
      .eq("id", id);

    if (error) {
      console.error("Erreur validation devis:", error);
      toast.error("Erreur validation devis", { description: error.message });
      return;
    }

    setInterventions((prev) =>
      prev.map((it: any) =>
        it.id === id ? { ...it, status: "approved_waiting_rdv" as InterventionStatus } : it
      )
    );

    toast.success("Devis validé", { description: "En attente de planification du RDV" });
  };

  // Action de refus (local uniquement)
  const handleReject = (id: string, description: string) => {
    setInterventions((prev) => prev.filter((i: any) => i.id !== id));
    toast.error("Devis refusé", {
      description: `La demande "${description}" a été refusée`,
    });
  };

  // Ouvrir modal RDV
  const openRdvModal = (intervention: Intervention) => {
    setSelectedIntervention(intervention);
    setRdvLieu((intervention as any).garage || "");
    setRdvModalOpen(true);
  };

  // Planifier RDV (agent_parc uniquement)
  const handlePlanRdv = async () => {
    if (!selectedIntervention || !rdvDate || !rdvTime || !rdvLieu) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (!UUID_REGEX.test(String((selectedIntervention as any).id))) {
      toast.error("Mode démo : action non disponible", {
        description: "Créez des interventions dans Supabase pour utiliser cette fonctionnalité",
      });
      return;
    }

    const rdvDateTime = `${rdvDate}T${rdvTime}:00`;

    const { error } = await supabase
      .from("interventions")
      .update({
        rdv_date: rdvDateTime,
        rdv_lieu: rdvLieu,
        status: "planned",
      })
      .eq("id", (selectedIntervention as any).id);

    if (error) {
      console.error("Erreur planification:", error);
      toast.error("Erreur lors de la planification", { description: error.message });
      return;
    }

    // Mettre à jour l'état local
    setInterventions((prev) =>
      prev.map((it: any) =>
        it.id === (selectedIntervention as any).id
          ? {
              ...it,
              status: "planned" as InterventionStatus,
              rdv_date: rdvDateTime,
              rdv_lieu: rdvLieu,
            }
          : it
      )
    );

    toast.success("RDV planifié", { description: "Intervention déplacée dans l’onglet Planifiés" });

    // Reset modal
    setRdvModalOpen(false);
    setSelectedIntervention(null);
    setRdvDate("");
    setRdvTime("");
    setRdvLieu("");

    router.push("/planning");
    router.refresh();
  };

  // Terminer intervention (agent_parc)
  const handleComplete = async (id: string) => {
    if (!UUID_REGEX.test(id)) {
      toast.error("Mode démo : action non disponible", {
        description: "Créez des interventions dans Supabase pour utiliser cette fonctionnalité",
      });
      return;
    }

    const { error } = await supabase
      .from("interventions")
      .update({ status: "completed" })
      .eq("id", id);

    if (error) {
      console.error("Erreur fin intervention:", error);
      toast.error("Erreur lors de la clôture", { description: error.message });
      return;
    }

    toast.success("Intervention terminée", { description: "Déplacée dans l’historique" });

    await fetchInterventions();
    setActiveTab("history");
  };

  // Ouvrir detail
  const openDetail = (intervention: Intervention) => {
    setDetailIntervention(intervention);
    setDetailOpen(true);
  };

  const filteredInterventions = getFilteredInterventions();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-slate-600 mt-2">Gestion des interventions et validations</p>
        </div>

        <div className="flex items-center gap-4">
          <RoleSwitcher onRoleChange={setRole} />

          {/* Bouton Nouvelle Demande */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle demande
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>Nouvelle demande d’intervention</DialogTitle>
                <DialogDescription>
                  Créez une demande de maintenance pour un véhicule du parc.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="immat">Immatriculation (doit exister dans Vehicles)</Label>
                  <Input
                    id="immat"
                    value={newImmat}
                    onChange={(e) => setNewImmat(e.target.value)}
                    placeholder="Ex: AB-123-CD"
                    list="vehicles-immats"
                  />
                  <datalist id="vehicles-immats">
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.immat} />
                    ))}
                  </datalist>

                  {newImmat.trim() && (
                    <p className="text-xs text-slate-500">
                      {matchedVehicle
                        ? "✓ Véhicule trouvé : liaison vehicle_id OK"
                        : "⚠️ Immat inconnue : intervention non liée au parc"}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vehicule">Véhicule</Label>
                  <Input
                    id="vehicule"
                    value={newVehicule}
                    onChange={(e) => setNewVehicule(e.target.value)}
                    placeholder="Ex: Renault Trucks T - Tracteur"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Ex: Révision 50 000 km"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="garage">Garage</Label>
                  <Input
                    id="garage"
                    value={newGarage}
                    onChange={(e) => setNewGarage(e.target.value)}
                    placeholder="Nom du garage..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montant">Montant estimé (EUR)</Label>
                  <Input
                    id="montant"
                    type="number"
                    value={newMontant}
                    onChange={(e) => setNewMontant(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreateIntervention}>Créer la demande</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Wrench className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
                <p className="text-sm text-slate-600">À valider</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{waitingRdvCount}</p>
                <p className="text-sm text-slate-600">RDV à planifier</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{plannedCount}</p>
                <p className="text-sm text-slate-600">Planifiés</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 rounded-lg">
                <Euro className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {interventions
                    .filter((i: any) => i.status !== "pending")
                    .reduce((sum: number, i: any) => sum + (Number(i.montant) || 0), 0)
                    .toLocaleString()}{" "}
                  EUR
                </p>
                <p className="text-sm text-slate-600">Budget validé</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            Toutes ({interventions.filter((i: any) => i.status !== "completed").length})
          </TabsTrigger>
          <TabsTrigger value="validation">À valider ({pendingCount})</TabsTrigger>
          <TabsTrigger value="planning">À planifier ({waitingRdvCount})</TabsTrigger>
          <TabsTrigger value="planned">Planifiés ({plannedCount})</TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-1" />
            Historique ({completedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">Chargement…</p>
              </CardContent>
            </Card>
          ) : filteredInterventions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-slate-500">Aucune intervention dans cette catégorie</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredInterventions.map((intervention: any) => {
                const statusBadge = getStatusBadge(intervention.status);

                return (
                  <Card
                    key={intervention.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => openDetail(intervention)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{intervention.vehicule}</CardTitle>
                          <p className="text-sm font-mono font-semibold text-blue-600">
                            {intervention.immat}
                          </p>
                        </div>
                        <Badge variant={statusBadge.variant} className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
                      {/* Description */}
                      <div className="flex items-start gap-3">
                        <Wrench className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-slate-900">{intervention.description}</p>
                          <p className="text-sm text-slate-500 mt-1">
                            Créé le {intervention.date_creation || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Garage */}
                      <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-slate-400" />
                        <p className="text-sm text-slate-700">{intervention.garage}</p>
                      </div>

                      {/* RDV info si planifié */}
                      {intervention.rdv_date && (
                        <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-800">
                              {new Date(intervention.rdv_date).toLocaleString("fr-FR")}
                            </p>
                            <p className="text-xs text-green-600">{intervention.rdv_lieu}</p>
                          </div>
                        </div>
                      )}

                      {/* Montant */}
                      <div className="flex items-center gap-3">
                        <Euro className="w-5 h-5 text-slate-400" />
                        <p className="text-lg font-bold text-slate-900">
                          {(Number(intervention.montant) || 0).toLocaleString()} EUR
                        </p>
                      </div>

                      {/* Boutons d'action selon status et role */}
                      {intervention.status === "pending" && permissions.canValidateDevis && (
                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                          <Button
                            variant="default"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveDevis(intervention.id)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Valider devis
                          </Button>
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleReject(intervention.id, intervention.description)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Refuser
                          </Button>
                        </div>
                      )}

                      {intervention.status === "approved_waiting_rdv" && permissions.canPlanRdv && (
                        <div className="pt-4 border-t border-slate-100">
                          <Button
                            variant="default"
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => openRdvModal(intervention)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Planifier RDV
                          </Button>
                        </div>
                      )}

                      {intervention.status === "planned" && permissions.canCompleteIntervention && (
                        <div className="pt-4 border-t border-slate-100">
                          <Button
                            variant="default"
                            className="w-full"
                            onClick={() => handleComplete(intervention.id)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Terminer l’intervention
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Planifier RDV */}
      <Dialog open={rdvModalOpen} onOpenChange={setRdvModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Planifier le RDV</DialogTitle>
            <DialogDescription>
              {(selectedIntervention as any)?.vehicule} - {(selectedIntervention as any)?.immat}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rdv-date">Date</Label>
              <Input
                id="rdv-date"
                type="date"
                value={rdvDate}
                onChange={(e) => setRdvDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rdv-time">Heure</Label>
              <Input
                id="rdv-time"
                type="time"
                value={rdvTime}
                onChange={(e) => setRdvTime(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rdv-lieu">Lieu / Adresse</Label>
              <Input
                id="rdv-lieu"
                value={rdvLieu}
                onChange={(e) => setRdvLieu(e.target.value)}
                placeholder="Adresse du garage"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setRdvModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handlePlanRdv}>Confirmer le RDV</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sheet Detail Intervention */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{(detailIntervention as any)?.vehicule}</SheetTitle>
            <SheetDescription className="font-mono text-blue-600">
              {(detailIntervention as any)?.immat}
            </SheetDescription>
          </SheetHeader>

          {detailIntervention && (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm text-slate-500">Statut</p>
                <Badge className={getStatusBadge((detailIntervention as any).status).className}>
                  {getStatusBadge((detailIntervention as any).status).label}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="font-medium">{(detailIntervention as any).description}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Garage</p>
                <p className="font-medium">{(detailIntervention as any).garage}</p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Montant</p>
                <p className="text-xl font-bold">
                  {(Number((detailIntervention as any).montant) || 0).toLocaleString()} EUR
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Date de création</p>
                <p>{(detailIntervention as any).date_creation || "-"}</p>
              </div>

              {(detailIntervention as any).rdv_date && (
                <>
                  <div>
                    <p className="text-sm text-slate-500">Date RDV</p>
                    <p className="font-medium">
                      {new Date((detailIntervention as any).rdv_date).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Lieu RDV</p>
                    <p>{(detailIntervention as any).rdv_lieu || "-"}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
