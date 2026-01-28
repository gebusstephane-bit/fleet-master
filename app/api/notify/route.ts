import { NextRequest, NextResponse } from 'next/server';
import { notifyMock, NOTIFY_RECIPIENTS } from '@/lib/notify';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, intervention, rdvDate, rdvLieu } = body;

    if (type === 'rdv_planned') {
      // Notification pour RDV planifie - envoyer a directeur + exploitation + parc
      const result = notifyMock({
        to: [
          NOTIFY_RECIPIENTS.directeur,
          NOTIFY_RECIPIENTS.exploitation,
          NOTIFY_RECIPIENTS.parc,
        ],
        subject: `[Fleet] RDV Maintenance planifie - ${intervention.immat}`,
        body: `
Un rendez-vous de maintenance a ete planifie :

Vehicule: ${intervention.vehicule} (${intervention.immat})
Intervention: ${intervention.description}
Garage: ${intervention.garage}
Montant: ${intervention.montant} EUR

Date du RDV: ${new Date(rdvDate).toLocaleString('fr-FR')}
Lieu: ${rdvLieu}

---
Notification automatique Fleet Manager
        `.trim(),
      });

      return NextResponse.json({
        success: result.success,
        message: result.message,
        recipients: result.recipients,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Type de notification inconnu' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Erreur notification:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
