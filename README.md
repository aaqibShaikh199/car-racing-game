# F1 Racing Car

An animated F1 car built with HTML, CSS, and JavaScript. It runs on Nginx inside a container and is deployed to Kubernetes with 2 replicas.

![F1 car at 200 km/h in 4th gear](docs/at-speed.png)

## How to play

Click **Start race**. When the lights go out, hold **Accelerate** or **Brake**.
Keyboard: **↑ / W** to accelerate, **↓ / S** to brake.

## 1. Deploy

You need `kubectl` and a cluster that can pull images from Docker Hub.

```bash
kubectl apply -f kubernetes.yaml
```

This creates a Deployment (2 pods of `aaqibshaikh199/argocd:car-racing-game`) and a Service.

Check that the pods are ready:

```bash
kubectl get pods -l app=f1-racing-car
```

Both pods should show `Running` and `1/1`.

## 2. Open the app

The Service is a NodePort on port `30080` (container port `8080`).

| Cluster        | How to open                                                                  |
|----------------|------------------------------------------------------------------------------|
| Docker Desktop | http://localhost:30080                                                       |
| minikube       | `minikube service f1-racing-car --url`                                       |
| Any cluster    | `kubectl port-forward service/f1-racing-car 8080:80`, then http://localhost:8080 |

## 3. Change the car color

Edit `--car-color` at the top of `style.css`:

```css
:root {
  --car-color: #ff0000;
}
```

Example colors: red `#ff0000`, blue `#0000ff`, teal `#00a19c`, papaya `#ff8000`, green `#1b7f3a`, black `#000000`.


## Remove the app

```bash
kubectl delete -f kubernetes.yaml
```