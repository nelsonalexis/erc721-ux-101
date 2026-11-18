# ERC721 UX 101

Projet réalisé dans le cadre du TD ERC721 UX 101.

L'objectif est de développer une interface web permettant d'interagir avec plusieurs contrats ERC721 déployés sur Ethereum Sepolia.

## Technologies utilisées

- React / TypeScript / Vite
- viem pour les interactions avec la blockchain
- MetaMask et WalletConnect pour la connexion des wallets
- Alchemy pour les appels RPC sur Sepolia

## Installation

```bash
git clone https://github.com/nelsonalexis/erc721-ux-101.git
cd erc721-ux-101
npm install
```

Créer un fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Renseigner les variables suivantes :

```env
VITE_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/alch_TYC2WOVHcYPpcB9FepSIK
VITE_WALLETCONNECT_PROJECT_ID=b52dca9f0004c3897f2752fce91f7b6c
```

Puis lancer le projet :

```bash
npm run dev
```

L'application est accessible sur `http://172.19.38.235:5173/`.

## Fonctionnalités

L'application permet de :

- Connecter un wallet avec MetaMask ou WalletConnect.
- Vérifier le réseau utilisé et basculer sur Sepolia.
- Consulter les informations de la blockchain et du wallet connecté.
- Interagir avec les contrats Fake BAYC, Fake Nefturians et Fake Meebits.
- Afficher les NFT détenus par une adresse et consulter leurs détails.
- Suivre les transactions et consulter leur statut sur Etherscan.
- Afficher un nom ENS lorsqu'il est disponible.

## Organisation du projet

Le code de l'interface se trouve principalement dans `src/App.tsx`.

Le fichier `src/chain.ts` contient la configuration des réseaux, des clients RPC et des contrats utilisés.

## Remarques

Le projet fonctionne sur le réseau de test Sepolia. Il faut donc disposer d'un wallet connecté à ce réseau et de Sepolia ETH pour effectuer les transactions.

Les métadonnées et les images des NFT sont récupérées depuis des services externes. Certaines ressources peuvent donc être indisponibles.
