import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { formatFullDate } from "@/lib/contest";
import { getActiveContest } from "@/lib/services/contest";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Règlement du jeu-concours — Burger by Night",
  description: "Règlement complet du jeu-concours GTA VI organisé par Burger by Night.",
};

function Article({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="glass-panel rounded-2xl p-6">
      <h2 className="flex items-baseline gap-3 font-display text-xl tracking-wide text-cream">
        <span className="text-gold">Art. {n}</span>
        <span>{title}</span>
      </h2>
      <div className="mt-3 space-y-1.5 text-sm leading-relaxed text-lavender">{children}</div>
    </section>
  );
}

export default async function ReglementPage() {
  const contest = await getActiveContest();

  // Le règlement doit rester affichable même hors période de concours : on
  // retombe alors sur les dates contractuelles de l'édition en cours.
  const startsAt = contest?.startsAt ?? new Date("2026-10-19T00:00:00+02:00");
  const endsAt = contest?.endsAt ?? new Date("2026-11-19T23:59:59+01:00");
  const pointsPerTicket = contest?.pointsPerTicket ?? 5;
  const freeTickets = contest?.freeTickets ?? 1;
  const draws = contest?.draws ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <header className="space-y-2">
        <span className="chip">Jeu-concours</span>
        <h1 className="text-4xl sm:text-5xl">
          <span className="arcade">Règlement</span>{" "}
          <span className="script text-5xl text-magenta-soft sm:text-6xl">du jeu</span>
        </h1>
        <p className="text-sm text-lavender">
          Édition « GTA VI » — du {formatFullDate(startsAt)} au {formatFullDate(endsAt)}.
        </p>
      </header>

      <Article n={1} title="Société organisatrice">
        <p>
          La société <strong className="text-cream">IL RESTO</strong>, société par actions
          simplifiée unipersonnelle au capital de 500 €, dont le siège social est situé 50 Rue
          Charles Faroux, 72100 Le Mans, immatriculée au Registre du Commerce et des Sociétés du
          Mans sous le numéro 903 058 097 (ci-après « l'Organisateur »), exploitant l'enseigne
          « Burger by Night », organise un jeu-concours gratuit sans obligation d'achat.
        </p>
        <p>
          Ce jeu n'est ni organisé, ni parrainé, ni administré par Rockstar Games, Take-Two
          Interactive, Sony Interactive Entertainment ou toute autre marque citée. Les marques et
          visuels mentionnés appartiennent à leurs titulaires respectifs.
        </p>
      </Article>

      <Article n={2} title="Durée du jeu">
        <p>
          Le jeu se déroule du {formatFullDate(startsAt)} au {formatFullDate(endsAt)} inclus.
          L'Organisateur se réserve le droit d'écourter, de proroger, de modifier ou d'annuler le
          jeu si les circonstances l'exigent, sans que sa responsabilité puisse être engagée.
        </p>
      </Article>

      <Article n={3} title="Conditions de participation">
        <p>
          Le jeu est ouvert à toute personne physique majeure (18 ans révolus) résidant en France
          métropolitaine, titulaire d'une carte de fidélité Burger by Night. La dotation étant un
          jeu vidéo classé PEGI 18, aucune participation de mineur ne sera prise en compte.
        </p>
        <p>
          Sont exclus l'Organisateur, ses salariés, ainsi que les membres de leur famille directe.
        </p>
        <p>
          Une seule carte de fidélité — donc un seul numéro de téléphone — est autorisée par
          personne. Toute participation frauduleuse, notamment par création de comptes multiples,
          entraîne l'annulation de l'ensemble des tickets du participant concerné.
        </p>
      </Article>

      <Article n={4} title="Modalités de participation">
        <p>
          La participation s'effectue au moyen de <strong className="text-cream">tickets</strong>.
          Chaque ticket correspond à une chance de gagner lors du tirage au sort.
        </p>
        <p>
          <strong className="text-cream">
            {freeTickets} ticket{freeTickets > 1 ? "s" : ""} est offert
          </strong>{" "}
          automatiquement et gratuitement à tout titulaire d'une carte de fidélité, sans aucune
          condition d'achat. Ce ticket suffit à participer à l'intégralité des tirages.
        </p>
        <p>
          Des tickets supplémentaires peuvent être obtenus en convertissant les points du programme
          de fidélité, à raison de{" "}
          <strong className="text-cream">{pointsPerTicket} points par ticket</strong>. Cette
          conversion est définitive : les points convertis sont déduits du solde et ne sont ni
          restitués, ni échangeables contre une somme d'argent.
        </p>
        <p>
          Le nombre de tickets par participant n'est pas limité, et le nombre de participants au jeu
          n'est pas limité.
        </p>
        <p>
          Les tickets sont <strong className="text-cream">cumulatifs sur toute la durée du jeu</strong> :
          ils ne sont pas consommés par un tirage et participent donc à l'ensemble des tirages
          restants.
        </p>
      </Article>

      <Article n={5} title="Dotation">
        <p>
          La dotation totale est composée de{" "}
          <strong className="text-cream">
            trois (3) exemplaires du jeu vidéo Grand Theft Auto VI en version PlayStation 5
          </strong>
          , soit un exemplaire par gagnant.
        </p>
        <p>
          La version PlayStation 5 est la seule proposée : aucune autre plateforme, notamment Xbox
          ou PC, ne pourra être demandée en remplacement.
        </p>
        <p>
          Le lot ne peut faire l'objet d'aucune contrepartie financière, d'aucun échange ni d'aucune
          reprise. Si le jeu n'était pas commercialisé à la date de remise du lot, l'Organisateur
          remettra au gagnant un bon d'achat d'une valeur équivalente au prix public constaté, ou
          le lot dès sa disponibilité.
        </p>
      </Article>

      <Article n={6} title="Désignation des gagnants">
        <p>
          <strong className="text-cream">Trois (3) tirages au sort</strong> sont organisés, à raison
          d'un gagnant par tirage, soit trois gagnants au total.
        </p>
        {draws.length > 0 && (
          <ul className="mt-2 space-y-1">
            {draws.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <span className="text-gold">›</span>
                <span>
                  {d.label} — {formatFullDate(d.scheduledFor)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p>
          Chaque tirage est effectué de manière aléatoire parmi l'ensemble des tickets valides à la
          date du tirage. Un participant détenant dix tickets dispose donc de dix fois plus de
          chances qu'un participant en détenant un seul.
        </p>
        <p>
          <strong className="text-cream">Un seul lot peut être attribué par participant.</strong>{" "}
          Un gagnant est automatiquement exclu des tirages suivants, afin de garantir trois gagnants
          distincts.
        </p>
      </Article>

      <Article n={7} title="Remise des lots">
        <p>
          Chaque gagnant est prévenu par téléphone ou SMS, au numéro associé à sa carte de fidélité,
          dans un délai de sept (7) jours ouvrés suivant le tirage.
        </p>
        <p>
          Le lot est à retirer sur place, auprès du camion Burger by Night, sur présentation d'une
          pièce d'identité. Passé un délai de trente (30) jours après la notification, ou en cas de
          coordonnées erronées ou injoignables, le lot est considéré comme abandonné et reste la
          propriété de l'Organisateur.
        </p>
      </Article>

      <Article n={8} title="Gratuité de la participation">
        <p>
          La participation au jeu est entièrement gratuite : le ticket offert à l'inscription permet
          de concourir à tous les tirages sans aucune dépense. L'obtention de tickets
          supplémentaires par conversion de points de fidélité constitue une simple faculté et ne
          conditionne en aucun cas la participation.
        </p>
        <p>
          Aucun frais de connexion n'est remboursé, la participation s'effectuant depuis un service
          en ligne accessible sans surcoût.
        </p>
      </Article>

      <Article n={9} title="Données personnelles">
        <p>
          Les données traitées dans le cadre du jeu (prénom, numéro de téléphone, nombre de tickets)
          sont celles déjà collectées au titre du programme de fidélité. Elles sont utilisées
          uniquement pour la gestion du jeu et la remise des lots, et ne sont ni cédées ni revendues
          à des tiers.
        </p>
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
          Informatique et Libertés, chaque participant dispose d'un droit d'accès, de rectification,
          d'opposition et de suppression de ses données, exerçable par simple demande à l'accueil du
          restaurant. Voir également les{" "}
          <Link href="/mentions-legales" className="text-magenta-soft underline">
            mentions légales
          </Link>
          .
        </p>
      </Article>

      <Article n={10} title="Responsabilité">
        <p>
          La responsabilité de l'Organisateur ne saurait être engagée en cas de dysfonctionnement du
          réseau internet, de panne, de perte de données ou de tout incident technique empêchant
          l'accès au service ou le bon déroulement du jeu.
        </p>
        <p>
          L'Organisateur ne saurait être tenu responsable d'un quelconque dommage lié à la
          jouissance du lot par son bénéficiaire.
        </p>
      </Article>

      <Article n={11} title="Acceptation du règlement">
        <p>
          La participation au jeu implique l'acceptation pleine et entière du présent règlement.
          Celui-ci est consultable gratuitement et à tout moment à cette adresse pendant toute la
          durée du jeu.
        </p>
      </Article>

      <Article n={12} title="Loi applicable et litiges">
        <p>
          Le présent règlement est soumis au droit français. Toute réclamation doit être adressée à
          l'Organisateur dans un délai de trente (30) jours suivant la clôture du jeu.
        </p>
        <p>
          À défaut d'accord amiable, tout litige relatif à l'interprétation ou à l'exécution du
          présent règlement relève de la compétence des tribunaux français.
        </p>
      </Article>

      <div className="pt-2 text-center">
        <Link href="/concours" className="btn-ghost inline-flex rounded-full px-6 py-3 text-sm">
          ← Retour au concours
        </Link>
      </div>
    </div>
  );
}
