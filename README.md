# F1 Racing Car

An animated Formula 1 car made with HTML, CSS, and JavaScript. Nginx serves the page from a small container, and Kubernetes runs two copies of it.

Press **Start race**. When the five lights go out, hold **Accelerate** or **Brake** (or use ↑/W and ↓/S).

## Screenshots

On the grid, before the start:

![Car waiting on the grid at 0 km/h](docs/on-the-grid.png)

The start lights coming on:

![Four start lights lit, car still in neutral](docs/start-lights.png)

Under power, at 200 km/h in 4th gear:

![Car at 200 km/h in 4th gear](docs/at-speed.png)

## Deploy to Kubernetes

You need Docker, `kubectl`, and a cluster (Docker Desktop, minikube, or kind).

The manifests already name the image `f1-racing-car:1.0.0`. `deployment.yaml` starts **2 pods**. `service.yaml` exposes them on **NodePort 30080**.

### 1. Build the image

From this folder:

```bash
docker build -t f1-racing-car:1.0.0 .
```

### 2. Give that image to the cluster

| Cluster | What to run |
|---|---|
| Docker Desktop | Nothing. It already shares images with Docker. |
| minikube | `minikube image load f1-racing-car:1.0.0` |
| kind | `kind load docker-image f1-racing-car:1.0.0` |

On a remote cluster, tag the image with your registry, push it, and set that name on the `image:` line in `deployment.yaml`.

### 3. Apply the manifests

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

### 4. Open the app

| Cluster | How to open it |
|---|---|
| Docker Desktop | http://localhost:30080 |
| minikube | `minikube service f1-racing-car --url` |
| Any cluster | `kubectl port-forward service/f1-racing-car 8080:80`, then http://localhost:8080 |

### 5. Check that it is running

```bash
kubectl get pods -l app=f1-racing-car
kubectl get service f1-racing-car
```

Both pods should show `Running` and `READY 1/1`.

### Remove it

```bash
kubectl delete -f service.yaml -f deployment.yaml
```
