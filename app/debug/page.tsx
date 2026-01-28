"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function DebugPage() {
  const [status, setStatus] = useState<any>({
    envVars: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + "...",
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    connectionTest: null,
    loading: false,
  });

  const testConnection = async () => {
    setStatus((prev: any) => ({ ...prev, loading: true, connectionTest: null }));

    try {
      console.log("🔍 Test de connexion Supabase...");
      console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("Key (preview):", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30));

      const { data, error, count } = await supabase
        .from("vehicles")
        .select("*", { count: "exact" });

      if (error) {
        console.error("❌ Erreur Supabase:", error);
        setStatus((prev: any) => ({
          ...prev,
          loading: false,
          connectionTest: {
            success: false,
            error: error.message,
            details: error,
          },
        }));
        return;
      }

      console.log("✅ Connexion réussie:", data);
      setStatus((prev: any) => ({
        ...prev,
        loading: false,
        connectionTest: {
          success: true,
          count: count || 0,
          vehicles: data,
        },
      }));
    } catch (err: any) {
      console.error("💥 Exception:", err);
      setStatus((prev: any) => ({
        ...prev,
        loading: false,
        connectionTest: {
          success: false,
          error: err.message,
          type: err.name,
        },
      }));
    }
  };

  // Test automatique au chargement
  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🔧 Debug Supabase</h1>
        <p className="text-slate-600 mt-2">
          Page de diagnostic de connexion à Supabase
        </p>
      </div>

      {/* Variables d'environnement */}
      <Card>
        <CardHeader>
          <CardTitle>1️⃣ Variables d'environnement (Côté Client)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-center gap-3">
              <span className="font-bold w-32">SUPABASE_URL:</span>
              <span className={status.envVars.hasUrl ? "text-green-600" : "text-red-600"}>
                {status.envVars.hasUrl ? "✅ Défini" : "❌ Non défini"}
              </span>
              <span className="text-slate-500">{status.envVars.url || "undefined"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold w-32">ANON_KEY:</span>
              <span className={status.envVars.hasKey ? "text-green-600" : "text-red-600"}>
                {status.envVars.hasKey ? "✅ Défini" : "❌ Non défini"}
              </span>
              <span className="text-slate-500">{status.envVars.keyPreview || "undefined"}</span>
            </div>
          </div>

          {(!status.envVars.hasUrl || !status.envVars.hasKey) && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-bold text-red-900">⚠️ PROBLÈME DÉTECTÉ</p>
              <p className="text-red-700 text-sm mt-2">
                Les variables d'environnement ne sont pas chargées. Le serveur Next.js doit être redémarré après toute modification du fichier .env.local.
              </p>
              <div className="mt-3 p-3 bg-white rounded border border-red-300">
                <p className="font-bold text-sm">Solution :</p>
                <ol className="list-decimal list-inside text-sm mt-2 space-y-1">
                  <li>Arrêter le serveur (Ctrl+C)</li>
                  <li>Vérifier que .env.local contient bien les variables</li>
                  <li>Redémarrer avec: <code className="bg-slate-100 px-2 py-1 rounded">npm run dev</code></li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test de connexion */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>2️⃣ Test de connexion à Supabase</CardTitle>
          <Button onClick={testConnection} disabled={status.loading}>
            {status.loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Tester la connexion
          </Button>
        </CardHeader>
        <CardContent>
          {status.loading && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="mt-3 text-slate-600">Test en cours...</p>
            </div>
          )}

          {!status.loading && status.connectionTest && (
            <div>
              {status.connectionTest.success ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="font-bold text-green-900 flex items-center gap-2">
                    ✅ Connexion réussie !
                  </p>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">Nombre de véhicules:</span>{" "}
                      {status.connectionTest.count}
                    </p>
                    <details className="mt-4">
                      <summary className="cursor-pointer font-semibold">
                        Voir les données récupérées
                      </summary>
                      <pre className="mt-2 p-3 bg-white rounded border overflow-auto text-xs">
                        {JSON.stringify(status.connectionTest.vehicles, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-bold text-red-900 flex items-center gap-2">
                    ❌ Échec de connexion
                  </p>
                  <div className="mt-3 space-y-2">
                    <p className="text-sm">
                      <span className="font-semibold">Type d'erreur:</span>{" "}
                      <code className="bg-red-100 px-2 py-1 rounded text-xs">
                        {status.connectionTest.type || "Unknown"}
                      </code>
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Message:</span>{" "}
                      <code className="bg-red-100 px-2 py-1 rounded text-xs">
                        {status.connectionTest.error}
                      </code>
                    </p>
                    <details className="mt-4">
                      <summary className="cursor-pointer font-semibold text-sm">
                        Détails techniques
                      </summary>
                      <pre className="mt-2 p-3 bg-white rounded border overflow-auto text-xs">
                        {JSON.stringify(status.connectionTest.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                </div>
              )}
            </div>
          )}

          {!status.loading && !status.connectionTest && (
            <p className="text-slate-500 text-center py-4">
              Cliquez sur "Tester la connexion" pour vérifier
            </p>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Checklist de dépannage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <span className={status.envVars.hasUrl && status.envVars.hasKey ? "text-green-600" : "text-slate-400"}>
                {status.envVars.hasUrl && status.envVars.hasKey ? "✅" : "⬜"}
              </span>
              <div>
                <p className="font-medium">Variables d'environnement chargées</p>
                <p className="text-slate-500">Les deux variables NEXT_PUBLIC_* doivent être définies</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className={status.connectionTest?.success ? "text-green-600" : "text-slate-400"}>
                {status.connectionTest?.success ? "✅" : "⬜"}
              </span>
              <div>
                <p className="font-medium">Connexion à Supabase fonctionnelle</p>
                <p className="text-slate-500">Le client peut récupérer des données depuis la base</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-slate-400">⬜</span>
              <div>
                <p className="font-medium">Script SQL exécuté dans Supabase</p>
                <p className="text-slate-500">
                  Table vehicles créée avec politique RLS{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    className="text-blue-600 underline"
                  >
                    Vérifier
                  </a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
