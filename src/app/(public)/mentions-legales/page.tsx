import type { Metadata, ReactNode } from "react";

export const metadata: Metadata = {
  title: "Mentions légales — Burger by Night",
  description: "Mentions légales du programme de fidélité Burger by Night.",
};

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass-panel rounded-2xl p-6">
      <h2 className="font-display text-xl tracking-wide text-cream">{title}</h2>
      <div className="mt-3 space-y-1.5 text-sm leading-relaxed text-lavender">{children}</div>
    </section>
  );
}

export default function MentionsLegales() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <header className="space-y-2">
        <span className="chip">Informations légales</span>
        <h1 className="text-4xl sm:text-5xl">
          <span className="arcade">Mentions</span>{" "}
          <span className="script text-5xl text-magenta-soft sm:text-6xl">légales</span>
        </h1>
      </header>

      <Block title="Éditeur du site">
        <p>
          <strong className="text-cream">Monsieur Jonathan Margotin</strong>, entrepreneur
          individuel.
        </p>
        <p>Siège : 4 Cour du Pavillon, 72290 Souligné-sous-Ballon.</p>
        <p>
          Immatriculé au répertoire des entreprises et établissements de l'INSEE sous le numéro
          917 538 845.
        </p>
      </Block>

      <Block title="Société exploitante">
        <p>
          <strong className="text-cream">IL RESTO</strong>, société par actions simplifiée
          unipersonnelle au capital social de 500 €.
        </p>
        <p>Siège social : 50 Rue Charles Faroux, 72100 Le Mans.</p>
        <p>
          Immatriculée au Registre du Commerce et des Sociétés du Mans sous le numéro 903 058 097.
        </p>
        <p>
          Représentée par M. Imed Louaguef, agissant et ayant les pouvoirs nécessaires en tant que
          président.
        </p>
      </Block>

      <Block title="Hébergeur">
        <p>
          <strong className="text-cream">ARKYA NETWORKS</strong>, société par actions simplifiée
          unipersonnelle au capital social de 1 000 €.
        </p>
        <p>Siège social : 61 Rue de Lyon, 75012 Paris.</p>
        <p>
          Immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 994 587 335.
        </p>
        <p>
          Représentée par M. Joan Rouve, agissant et ayant les pouvoirs nécessaires en tant que
          président.
        </p>
      </Block>

      <Block title="Données personnelles">
        <p>
          Dans le cadre du programme de fidélité Burger by Night, nous collectons votre prénom et
          votre numéro de téléphone, uniquement afin de gérer votre carte de fidélité, vos points
          et vos récompenses.
        </p>
        <p>
          Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
          Informatique et Libertés, vous disposez d'un droit d'accès, de rectification,
          d'opposition et de suppression de vos données. Pour exercer ces droits, adressez votre
          demande à l'accueil du restaurant.
        </p>
        <p>
          Vos données ne sont jamais cédées ni revendues à des tiers à des fins commerciales.
        </p>
      </Block>

      <Block title="Propriété intellectuelle">
        <p>
          L'ensemble des éléments de ce site (marque, logo « Burger by Night », visuels, textes)
          est protégé par le droit de la propriété intellectuelle. Toute reproduction sans
          autorisation préalable est interdite.
        </p>
      </Block>
    </div>
  );
}
