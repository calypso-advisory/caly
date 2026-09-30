# Calypso Advisory · site et tableau de bord

Site public (Next.js, rendu côté serveur, une vraie adresse par page) et tableau de bord d'administration des demandes reçues par le formulaire « Faire le point ».

- **Site** : `/`, `/audits`, `/cockpit`, `/approche`, `/professionnels`, `/cabinet`, `/faire-le-point`, `/mentions-legales`. Mêmes pages et mêmes animations que la maquette validée.
- **Formulaire** : les demandes sont enregistrées dans Supabase (base hébergée à Londres). Une alerte e-mail peut partir à chaque demande. L'e-mail ne contient aucun détail confidentiel, seulement le nom, la société et un lien vers le tableau de bord.
- **Tableau de bord** : `/admin`, protégé par identifiant et réservé aux adresses listées dans `ADMIN_EMAILS`. On y trouve la liste des demandes, la recherche, le statut (Nouvelle, En cours, Traitée, Archivée), les notes internes, la suppression et l'export CSV (lisible dans Excel).
- **Référencement** : titres et descriptions par page, `sitemap.xml`, `robots.txt`. `/admin` n'est jamais indexé.

## Mise en ligne (environ 30 minutes, une seule fois)

### 1. Supabase (base de données et comptes)

La base est en place dans le projet « Calypso Project » (région Londres) : la table des demandes, la table des administrateurs et les règles d'accès. Le script est dans `supabase/migrations/0001_demandes.sql`.

Sécurité : le site public ne peut que déposer une demande, via une fonction contrôlée qui vérifie les champs et limite les envois. Il ne peut en lire aucune. Seuls les comptes connectés et inscrits dans la table `admins` voient les demandes : c'est la base elle-même qui l'impose. Aucune clé secrète n'est nécessaire côté site.

Pour donner accès au tableau de bord à une personne :
1. **Authentication**, puis **Users**, puis **Add user** : saisir son e-mail et un mot de passe, et cocher « Auto confirm ».
2. **SQL Editor** : `insert into public.admins (email) values ('prenom@domaine.fr');`
3. Recommandé : **Authentication**, puis **Sign In / Providers**, puis désactiver **Allow new users to sign up**.

### 2. GitHub (le code)

1. Sur github.com, créer un dépôt **privé**, par exemple `calypso-advisory`.
2. Y déposer le contenu de ce dossier : bouton **uploading an existing file**, glisser tous les fichiers, puis **Commit**. Autre possibilité : pousser le dépôt Git déjà initialisé dans le dossier.

### 3. Vercel (l'hébergement)

1. Sur vercel.com, se connecter avec GitHub, puis **Add New… → Project**. Importer le dépôt. Vercel détecte Next.js tout seul.
2. Dans **Environment Variables**, ajouter les variables suivantes (le modèle est dans `.env.example`) :

| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | l'adresse définitive, par ex. `https://www.calypso-advisory.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | l'URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clé publique `anon` |
| `ADMIN_EMAILS` | facultatif, verrou supplémentaire |
| `RESEND_API_KEY`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM` | facultatif, pour l'alerte e-mail (étape 5) |

3. Cliquer sur **Deploy**. Le site est en ligne sur une adresse `…vercel.app` en une à deux minutes.
4. Les fonctions serveur tournent à Londres (`vercel.json`), au plus près de la base.

### 4. Nom de domaine

Dans Vercel, aller dans **Settings → Domains**, ajouter le domaine, puis créer chez le registrar (OVH, Gandi…) les enregistrements DNS indiqués par Vercel. Le certificat HTTPS est automatique.

### 5. Alerte e-mail (facultatif)

Sur resend.com, vérifier votre domaine d'envoi, créer une clé API, puis renseigner dans Vercel :
- `RESEND_API_KEY` : la clé créée ;
- `ALERT_EMAIL_TO` : la ou les adresses qui reçoivent l'alerte ;
- `ALERT_EMAIL_FROM` : l'expéditeur, sur le domaine vérifié.

Redéployer ensuite.

### 6. Vérifier

Envoyer une demande depuis `/faire-le-point`, puis ouvrir `/admin` et se connecter : la demande doit apparaître.

## Avant l'ouverture au public

- Compléter **Mentions légales** : raison sociale, forme, capital, SIREN, adresse du siège, directeur de la publication, et **hébergeur** (Vercel Inc., avec son adresse).
- Ajouter une **politique de confidentialité** : finalité (répondre à la demande), base légale, durée de conservation des demandes, sous-traitants (Supabase, Vercel, Resend), droits des personnes.
- Accepter les accords de traitement des données (DPA) de Supabase et de Vercel depuis leurs tableaux de bord.
- Le site ne dépose aucun cookie de mesure d'audience. Si vous en ajoutez un plus tard, il faudra un bandeau de consentement.

## Faire évoluer

- **Travailler en local** : `npm install`, copier `.env.example` en `.env.local`, puis `npm run dev`.
- **Chaque modification** poussée sur GitHub est déployée automatiquement par Vercel. Chaque branche obtient sa propre adresse de prévisualisation.
- **Réimporter la maquette** : les pages publiques sont générées depuis la maquette HTML validée, avec `python3 scripts/import-maquette.py chemin/vers/calypso-site.html`. Cette commande régénère `content/fragments.ts`, `app/(site)/site.css` et `public/legacy/site.js`. Les ajouts propres à la version en ligne sont dans `app/(site)/site-extra.css`.
- **Pistes suivantes** : articles et actualités gérés depuis `/admin`, prise de rendez-vous, espace client sécurisé pour l'échange de documents, lien avec Notariact.

## Structure

```
app/(site)/           pages publiques, en-tête, pied de page, chargement des animations
app/admin/            tableau de bord (connexion, liste, fiche, export CSV)
app/api/contact/      réception du formulaire
content/              contenu des pages (généré) et métadonnées SEO
lib/                  accès Supabase et contrôle d'accès
public/legacy/site.js animations (issues de la maquette)
public/vendor/        three.js r128 (licence MIT), hébergé avec le site
supabase/migrations/  schéma de la base
middleware.ts         protection de /admin
```
