import { metaFor } from '../StaticPage';
import { EDITEUR, HEBERGEUR } from '@/content/legal';

export async function generateMetadata() {
  return metaFor('mentions');
}

/* Page écrite ici, et non dans content/fragments.ts (fichier généré depuis la maquette) :
   l'identité de l'éditeur vient de content/legal.ts et ne doit pas être écrasée par un nouvel import. */
export default function Page() {
  return (
    <div style={{ display: 'contents' }}>
      <main data-page="mentions">
        <section className="phero dk">
          <div className="orbs"><span></span><span></span><span></span></div>
          <div className="wrap stack-lg"><div className="eyebrow">Informations légales</div><h1>Mentions légales</h1></div>
        </section>
        <section className="band dk legal">
          <div className="wrap legal-grid">
            <div>
              <h2>Éditeur du site</h2>
              <p>
                {EDITEUR.marque} est une marque exploitée par {EDITEUR.denomination}, {EDITEUR.forme} au capital de {EDITEUR.capital}, immatriculée à {EDITEUR.immatriculation}.<br />
                Siège : {EDITEUR.siege}.<br />
                Contact : {EDITEUR.contact}.
              </p>
            </div>
            <div><h2>Directeur de la publication</h2><p>{EDITEUR.representant}, {EDITEUR.qualite} de {EDITEUR.denomination}.</p></div>
            <div><h2>Hébergeur</h2><p>{HEBERGEUR.nom}, {HEBERGEUR.adresse} ({HEBERGEUR.site}).</p></div>
            <div><h2>Propriété intellectuelle</h2><p>L'ensemble du contenu du site (textes, identité visuelle, structure) est protégé par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.</p></div>
            <div><h2>Nature des activités</h2><p>Calypso Advisory exerce une activité de conseil, d'accompagnement et de pilotage auprès d'entreprises en difficulté et de leurs conseils. Le cabinet n'exerce ni activité juridique réglementée, ni activité d'expertise-comptable, ni fonction de mandataire de justice.</p></div>
            <div><h2>Données personnelles</h2><p>Les informations transmises via les formulaires sont utilisées exclusivement pour préparer les échanges avec le cabinet. Vous disposez d'un droit d'accès, de rectification et de suppression en écrivant à {EDITEUR.contact}.</p></div>
          </div>
        </section>
      </main>
    </div>
  );
}
