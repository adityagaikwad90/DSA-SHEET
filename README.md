🚀 Vite React App (Dockerized)
This project is a Vite + React application packaged inside a Docker image and served using Nginx.
Anyone with Docker installed can run this project without installing Node.js or npm.
🧰 Tech Stack
⚛️ React (Vite)
🐳 Docker (Multi-stage build)
🌐 Nginx (Production server)
📦 Docker Image
The application is distributed as a Docker image, which already contains:
Built React app
Nginx web server
▶️ How to Run This Project (Recommended)
Prerequisite
Docker installed and running
Step 1: Pull the Docker image
Step 2: Run the container
docker pull adityagaikwad/vite-react-app
docker run -p 3000:80 adityagaikwad/vite-react-app
Step 3: Open in browser
http://localhost:3000
🎉 The application will start instantly.

🛠️ For Developers (Build Locally)
If you want to build the image yourself:
docker build -t vite-react-app .
docker run -p 3000:80 vite-react-app
📁 Project Structure
vite-project/
├── src/                # React source code
├── public/             # Static assets
├── dist/               # Production build output
├── Dockerfile          # Docker configuration
├── package.json
└── README.md
🧠 How It Works
Multi-stage Docker build:
Stage 1: Build React app using Node
Stage 2: Serve built files using Nginx
Optimized for small image size and fast load time
✅ Why Docker?
No environment setup issues
Same behavior on all systems
Easy deployment and sharing
📌 Notes
Default port: 3000
You can change the port mapping if needed:
docker run -p 8080:80 your-docker-username/vite-react-app
👤 Author
Aditya Gaikwad
FY MCA Student | Web Developer
GitHub: https://github.com/adityagaikwad90
⭐ If you like this project
Give it a ⭐ on GitHub!
🎓 Interview-Ready Summary
This project demonstrates how to containerize a React application using Docker and serve it efficiently with Nginx using a multi-stage build approach.


                 👨‍💻 DEVELOPER (YOU)
          ┌────────────────────────────────┐
          │ React Source Code + Dockerfile │
          │        (vite-project)          │
          └──────────────┬────────────────┘
                         │
                         │ docker build
                         ▼
                ┌───────────────────┐
                │   Docker Image    │
                │  vite-react-app   │
                │ (Nginx + React)   │
                └──────────────┬────┘
                               │
                               │ docker push
                               ▼
                  🌐 Docker Hub (Registry)
                ┌─────────────────────────┐
                │ yourname/vite-react-app │
                └──────────────┬──────────┘
                               │
         ┌─────────────────────┴─────────────────────┐
         │                                           │
         ▼                                           ▼
 👤 USER / INTERVIEWER                         👤 ANOTHER USER
 (has Docker only)                            (has Docker only)
         │                                           │
         │ docker pull                               │ docker pull
         ▼                                           ▼
 ┌────────────────────┐                   ┌────────────────────┐
 │ Docker Image       │                   │ Docker Image       │
 │ vite-react-app     │                   │ vite-react-app     │
 └─────────────┬──────┘                   └─────────────┬──────┘
               │                                          │
               │ docker run                               │ docker run
               ▼                                          ▼
      ┌───────────────────┐                    ┌───────────────────┐
      │ Running Container │                    │ Running Container │
      │ (Nginx serving    │                    │ (Nginx serving    │
      │  React app)       │                    │  React app)       │
      └─────────┬─────────┘                    └─────────┬─────────┘
                │                                          │
                ▼                                          ▼
        🌐 http://localhost:3000                   🌐 http://localhost:3000
