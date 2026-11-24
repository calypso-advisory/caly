import type { Metadata } from 'next';
import OppositionForm from '../OppositionForm';

export const metadata: Metadata = {
  title: 'Ne plus être contacté',
  description: 'Retirer votre numéro des messages de Calypso Advisory.',
  alternates: { canonical: '/opposition' },
  robots: { index: false, follow: false }
};

export default function Page() {
  return (
    <main data-page="lp-opposition" data-landing="opposition" data-campagne="">
      <section className="phero dk">
        <div className="orbs"><span></span><span></span><span></span></div>
        <div className="wrap stack-lg">
          <div className="eyebrow" data-reveal="">Vos données</div>
          <h1 data-words="">Ne plus recevoir de message de Calypso.</h1>
        </div>
      </section>
      <section className="band dk fp-band" id="faire-le-point">
        <div className="wrap fp">
          <div className="stack-lg">
            <p className="lead" data-reveal="">Indiquez le numéro concerné. Il sera retiré de nos envois. Vous pouvez aussi répondre STOP au SMS reçu.</p>
            <p className="micro" data-reveal="">Pour connaître l'origine de vos données ou les faire supprimer, écrivez à audit@calypso-advisory.com.</p>
          </div>
          <div className="lp-form-wrap" data-reveal="scale">
            <OppositionForm />
          </div>
        </div>
      </section>
    </main>
  );
}
