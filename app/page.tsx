"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Euro, FileText, TrendingUp, Wrench, ChevronRight } from "lucide-react";
import { VEHICLES, INTERVENTIONS } from "@/lib/data";
import { differenceInDays, isPast } from "date-fns";

export default function DashboardPage() {
  const today = new Date();

  // Vehicules critiques : date_mines ou date_tachy perimee ou < 7 jours
  const criticalVehicles = VEHICLES.filter(
    (v) =>
      isPast(v.date_mines) ||
      differenceInDays(v.date_mines, today) < 7 ||
      isPast(v.date_tachy) ||
      differenceInDays(v.date_tachy, today) < 7
  );
  const vehiculesCritiques = criticalVehicles.length;

  // Budget maintenance : somme des interventions validees (pas pending)
  const budgetMaintenance = INTERVENTIONS.filter(
    (i) => i.status !== "pending"
  ).reduce((sum, i) => sum + i.montant, 0);

  // Devis a valider : interventions en attente
  const pendingInterventions = INTERVENTIONS.filter((i) => i.status === "pending");
  const devisAValider = pendingInterventions.length;

  // Interventions planifiees (en maintenance)
  const plannedInterventions = INTERVENTIONS.filter((i) => i.status === "planned");

  // Total du parc
  const totalVehicules = VEHICLES.length;

  // Vehicules en maintenance
  const vehiculesEnMaintenance = VEHICLES.filter(
    (v) => v.status === "maintenance"
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Vue d'ensemble de votre flotte</p>
      </div>

      {/* Stat Cards - Cliquables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vehicules Critiques */}
        <Link href="/parc?filter=critical">
          <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${vehiculesCritiques > 0 ? "border-red-200" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Vehicules Critiques
              </CardTitle>
              <div className="flex items-center gap-1">
                <AlertTriangle
                  className={`w-5 h-5 ${
                    vehiculesCritiques > 0 ? "text-red-600" : "text-slate-400"
                  }`}
                />
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-4xl font-bold ${
                  vehiculesCritiques > 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {vehiculesCritiques}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {vehiculesCritiques > 0
                  ? "Maintenance urgente requise"
                  : "Tous les vehicules sont a jour"}
              </p>
              {/* Mini-liste */}
              {criticalVehicles.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {criticalVehicles.slice(0, 5).map((v) => (
                    <div key={v.id} className="text-xs flex justify-between">
                      <span className="font-mono font-semibold text-red-600">{v.immat}</span>
                      <span className="text-slate-500">{v.marque}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Devis a Valider */}
        <Link href="/maintenance?tab=validation">
          <Card className={`cursor-pointer hover:shadow-lg transition-shadow ${devisAValider > 0 ? "border-orange-200" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Devis a Valider
              </CardTitle>
              <div className="flex items-center gap-1">
                <FileText
                  className={`w-5 h-5 ${
                    devisAValider > 0 ? "text-orange-600" : "text-slate-400"
                  }`}
                />
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-4xl font-bold ${
                  devisAValider > 0 ? "text-orange-600" : "text-slate-900"
                }`}
              >
                {devisAValider}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {devisAValider > 0
                  ? "En attente d'approbation"
                  : "Aucun devis en attente"}
              </p>
              {/* Mini-liste */}
              {pendingInterventions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {pendingInterventions.slice(0, 5).map((i) => (
                    <div key={i.id} className="text-xs flex justify-between">
                      <span className="font-mono font-semibold text-orange-600">{i.immat}</span>
                      <span className="text-slate-500">{i.montant} EUR</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* En maintenance (Planning) */}
        <Link href="/planning">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                En Maintenance
              </CardTitle>
              <div className="flex items-center gap-1">
                <Wrench className="w-5 h-5 text-blue-600" />
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">
                {plannedInterventions.length}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                RDV planifies
              </p>
              {/* Mini-liste */}
              {plannedInterventions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {plannedInterventions.slice(0, 5).map((i) => (
                    <div key={i.id} className="text-xs flex justify-between">
                      <span className="font-mono font-semibold text-blue-600">{i.immat}</span>
                      <span className="text-slate-500">
                        {i.rdv_date ? new Date(i.rdv_date).toLocaleDateString("fr-FR") : "-"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alerte si vehicules critiques */}
      {vehiculesCritiques > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">
                  Action requise : {vehiculesCritiques} vehicule
                  {vehiculesCritiques > 1 ? "s" : ""} en alerte
                </p>
                <p className="text-sm text-red-700">
                  Des controles techniques ou tachygraphes arrivent a echeance.
                  Consultez la page{" "}
                  <Link href="/parc?filter=critical" className="underline font-medium">
                    Mon Parc
                  </Link>{" "}
                  pour plus de details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vue d'ensemble du parc */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Synthese du parc */}
        <Card>
          <CardHeader>
            <CardTitle>Synthese du parc</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-medium">
                Total vehicules
              </span>
              <span className="text-2xl font-bold text-slate-900">
                {totalVehicules}
              </span>
            </div>
            <Link href="/parc">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                <span className="text-green-700 font-medium">Actifs</span>
                <span className="text-2xl font-bold text-green-600">
                  {VEHICLES.filter((v) => v.status === "actif").length}
                </span>
              </div>
            </Link>
            <Link href="/planning">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                <span className="text-orange-700 font-medium">En maintenance</span>
                <span className="text-2xl font-bold text-orange-600">
                  {vehiculesEnMaintenance}
                </span>
              </div>
            </Link>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <span className="text-slate-700 font-medium">Au garage</span>
              <span className="text-2xl font-bold text-slate-600">
                {VEHICLES.filter((v) => v.status === "garage").length}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Activite recente */}
        <Card>
          <CardHeader>
            <CardTitle>Activite recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {INTERVENTIONS.slice(0, 4).map((intervention) => (
              <Link
                key={intervention.id}
                href={`/maintenance`}
              >
                <div className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded p-2 -m-2 cursor-pointer transition-colors">
                  <div
                    className={`p-2 rounded-lg ${
                      intervention.status === "completed"
                        ? "bg-slate-100"
                        : intervention.status === "planned"
                        ? "bg-green-100"
                        : intervention.status === "approved_waiting_rdv"
                        ? "bg-blue-100"
                        : intervention.status === "pending"
                        ? "bg-orange-100"
                        : "bg-slate-100"
                    }`}
                  >
                    {intervention.status === "completed" ? (
                      <TrendingUp className="w-4 h-4 text-slate-600" />
                    ) : intervention.status === "planned" ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : intervention.status === "pending" ? (
                      <FileText className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Wrench className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {intervention.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-mono text-blue-600">{intervention.immat}</span> - {intervention.dateCreation}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {intervention.montant.toLocaleString()} EUR
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Budget Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Budget Maintenance</CardTitle>
          <Euro className="w-5 h-5 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-slate-900">
            {budgetMaintenance.toLocaleString()} EUR
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Total des interventions validees et planifiees
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
