## 🌿 Flujo de Trabajo (Git Workflow)

**NUNCA trabajes directamente en la rama `main`.**

1. Actualiza tu rama principal: `git checkout main` y luego `git pull origin main`
2. Crea tu rama de trabajo: `git checkout -b feature/nombre-de-tu-tarea`
* **`[FEAT]`**: Para añadir funcionalidades, describe lo que añadiste en el commit.
* **`[CHORE]`**: Para tareas, describe la tarea hecha en el commit.
* **`[FIX]`**: Para arreglar, describe el problema que arreglaste en el commit.
* **`[DOC]`**: para documentación, describe la documentación agregada en el commit.
* **`[PERF]`**: Para optimización, describe lo que optimizaste en el commit.
* **`[REFACTOR]`**: para refactorización, describe lo que refactorizaste en el commit.
3. Revisamos en qué rama nos encontramos: `git branch`
4. Revisamos qué archivos hemos modificado: `git status`
5. Añade todos los cambios trabajados en memoria: `git add .`
6. Guarda los cambios: `git commit -m "feat: agregué X componente"`
7. Sube tu rama: `git push -u origin feature/nombre-de-tu-tarea`
8. Ve a GitHub y abre un **Pull Request** para revisión, agrega una descripción clara y crea el pull request.
9. Cuando se apruebe el merge regresa a la rama principal y actualízala: `git checkout main` y luego `git pull origin main`
