# F1 Racing Car

An animated Formula 1 car made with HTML, CSS, and JavaScript. Nginx serves it from a container, and Kubernetes runs two copies.

Press **Start race**. When the lights go out, hold **Accelerate** or **Brake** (or use ↑/W and ↓/S).

![Car at 200 km/h in 4th gear](docs/at-speed.png)

## Step 01: Deploy the application

You need `kubectl` and a cluster that can pull from Docker Hub.

`kubernetes.yaml` holds both the Deployment and the Service. It runs **2 pods** of `aaqibshaikh199/argocd:car-racing-game`.

```bash
kubectl apply -f kubernetes.yaml
```

Kubernetes pulls the image if the node does not already have it. Check that both pods are up:

```bash
kubectl get pods -l app=f1-racing-car
```

Both should show `Running` and `READY 1/1`.

To remove the app:

```bash
kubectl delete -f kubernetes.yaml
```

## Step 02: Access the application

The Service is a **NodePort on 30080**. It forwards to port 8080 in the container.

| Cluster | How to open it |
|---|---|
| Docker Desktop | http://localhost:30080 |
| minikube | `minikube service f1-racing-car --url` |
| Any cluster | `kubectl port-forward service/f1-racing-car 8080:80`, then http://localhost:8080 |

## Step 03: Change the car color

Open `style.css` and change `--car-color` near the top of the file:

```css
:root {
    --car-color: #ff0000;
}
```

That one value repaints the bodywork, wings, cockpit, and wheel hubs.

| Color | Code |
|---|---|
| Red | `#ff0000` |
| Blue | `#0000ff` |
| Teal | `#00a19c` |
| Papaya | `#ff8000` |
| Green | `#1b7f3a` |
| Black | `#000000` |

The **Car color** picker on the page is only a live preview. **Reset** puts the car back to the color in `style.css`.

The cluster serves the color that was baked into the image. After you edit `style.css`, build and push again, then reapply:

```bash
docker build -t aaqibshaikh199/argocd:car-racing-game .
docker push aaqibshaikh199/argocd:car-racing-game
kubectl apply -f kubernetes.yaml
kubectl rollout restart deployment/f1-racing-car
```
