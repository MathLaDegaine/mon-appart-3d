# 📐 OpenAppart 3D

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Three.js](https://img.shields.io/badge/Three.js-r160-black?logo=three.js)](https://threejs.org/)
[![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20ES6-yellow)](https://developer.mozilla.org/)

**OpenAppart 3D** est une application web open-source d'aménagement d'intérieur et de modélisation 3D temps réel, conçue pour être ultra-légère, accessible dans le navigateur et sans dépendances lourdes. 

Pensez **Sweet Home 3D**, mais en version moderne, open-source et adaptée aux étudiants ou jeunes actifs qui s'installent dans leur premier appartement.

---

## ✨ Fonctionnalités

- **⚡ Moteur WebGL temps réel :** Propulsé par Three.js en import ES modules.
- **📏 Échelle réelle (1m = 1 unité 3D) :** Modélisation fidèle des espaces et du mobilier.
- **🖱️ Placement intuitif :** Glisser-déposer au sol par raycasting de précision.
- **🔄 Rotation fluide :** Pivot incrémental des objets via raccourci clavier.
- **🛠️ Contraintes techniques :** Intégration des fenêtres, portes, prises électriques et arrivées d'eau sur le plan.
- **💾 Export JSON :** Exporte l'agencement exact (coordonnées et rotations) pour l'intégrer à d'autres outils ou le sauvegarder localement.

---

## 🚀 Lancement rapide

Le projet utilisant des **Imports ES6 (`importmap`)**, les règles de sécurité CORS des navigateurs empêchent l'ouverture directe du fichier `index.html` via un double-clic (`file://`). Vous devez utiliser un serveur HTTP local.

### Option 1 : Via VS Code (Recommandé)
1. Ouvrez le dossier du projet dans Visual Studio Code.
2. Installez l'extension **Live Server**.
3. Faites un clic droit sur `index.html` > **Open with Live Server**.

### Option 2 : Via Python
Si Python est installé sur votre machine, ouvrez votre terminal dans le dossier du projet :

```bash
# Python 3
python -m http.server 8000
