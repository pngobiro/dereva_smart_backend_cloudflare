# 🏙️ NTSA Nairobi City Model — Blender Script

> Procedural hyper-realistic 3D model of Nairobi CBD for the  
> **NTSA B1 Driving Simulator** training programme

---

## 📋 Requirements

| Tool | Minimum Version |
|------|----------------|
| Blender | 3.3 LTS or 4.x |
| OS | Windows / macOS / Linux |
| VRAM (GPU render) | 4 GB+ recommended |
| RAM | 8 GB minimum |

---

## 🚀 How to Use

### Step 1 — Open Blender
Download free from **blender.org** if not installed.

### Step 2 — Open Scripting Workspace
Click the **Scripting** tab at the top of Blender.

### Step 3 — Load the Script
- Click **New** to create a new text block  
- Or click **Open** and select `nairobi_city_model.py`  
- Or paste the entire script content

### Step 4 — Run It
Press **Alt + P** (or click the ▶ Run Script button).  
Watch the console for progress — it builds in ~30–60 seconds.

### Step 5 — Explore
Switch to the **3D Viewport**. Press **Numpad 0** to look through the camera.  
Use the Outliner to toggle collections on/off.

---

## 🗺️ What's Built

### Road Network (Kenya Traffic Act layout)
- **Kenyatta Avenue** — main E-W arterial with dual carriageway
- **Moi Avenue** — main N-S arterial
- **Tom Mboya Street** — busy N-S commercial corridor  
- **Haile Selassie Avenue** — southern CBD ring
- **University Way** — northern CBD edge
- **Kimathi Street** — parallel to Moi, government quarter
- **Uhuru Highway** — wide western expressway
- Yellow centre lines, white edge markings, zebra crossings

### Iconic Nairobi Landmarks
| Landmark | Detail |
|----------|--------|
| **KICC** | Circular tower, stepped base rings, helipad, conference wing, flagpoles |
| **Times Tower** | 4-stage setback design, glass curtain walls, spire |
| **Parliament Buildings** | Colonnaded portico, dome |
| **Uchumi House** | CBD commercial block |
| **Nation Centre** | 22-floor CBD tower |
| **Hilton Hotel** | 24-floor corner tower |
| **Intercontinental Hotel** | Bronze glass facade |
| **Treasury / Harambee House** | Government quarter |

### Traffic Infrastructure
- 10 signalised intersections with red/amber/green traffic lights
- STOP, YIELD, SPEED 50, KEEP LEFT, NO OVERTAKE signs
- Globe Roundabout (Haile Selassie / Uhuru Highway)
- CBD roundabout (Moi / Kenyatta)
- Kerbs and pavements along main streets

### Vegetation
- **60 Uhuru Park trees** (Jacaranda, Acacia, Generic, Palm varieties)
- **20 Jeevanjee Gardens trees**
- **Street Jacarandas** along Kenyatta Ave and University Way
- Grass ground cover for Uhuru Park and Central Park strip

### Street Life
- **8 matatus** (Toyota HiAce style) parked and in-lane
- **9 parked cars** with random colours
- **6 bus shelters** with glass back panels
- **Street lampposts** with glow emission along major roads
- **Benches** along Kenyatta Ave pavement
- **Jua Kali market stalls** — coloured canopies near Jeevanjee, Tom Mboya, River Road

### Environment
- **Nairobi River** corridor (south of CBD)
- **Laterite red soil** patches (Kenya's characteristic earth)
- **PBR Materials** on all objects (roughness, metallic, specular)
- **Nishita sky** (equatorial sun, 62° elevation, slight haze)
- **Cycles** render engine pre-configured (256 samples + denoising)

---

## 📸 Camera Views

Four cameras are created automatically:

| Camera | Description |
|--------|-------------|
| `Cam_CBD_Overview` | Wide aerial view of full CBD |
| `Cam_KICC_Hero` | Dramatic angle showing KICC |
| `Cam_StreetLevel` | Street-level on Kenyatta Ave |
| `Cam_Aerial` | Straight-down aerial / minimap view |

Switch camera: **Numpad 0** → then use Outliner to select different cameras.

---

## 📤 Export for Web Simulator

To use this model in the Three.js driving simulator:

1. `File > Export > glTF 2.0 (.glb)`
2. Settings:
   - ✅ Include: Selected Objects or Visible Objects
   - ✅ Geometry: Apply Modifiers, UV's
   - ✅ Materials: Export
   - Format: **glb (binary)**
3. Replace the procedural Three.js scene with the loaded `.glb`

### Load in Three.js:
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('nairobi.glb', (gltf) => {
    scene.add(gltf.scene);
});
```

---

## 🎨 Customisation

### Add More Buildings
```python
# In build_cbd_buildings(), add to the buildings list:
('My_Building', x, y, width, depth, floors, 'facade_cream', 'glass_blue'),
```

### Change Traffic Light Phase
```python
# In build_all_traffic_lights():
# phase 0 = red on, 1 = amber on, 2 = green on
intersections.append((x, y, 2))  # green light at (x, y)
```

### Add More Trees
```python
build_tree('MyTree', x, y, 'jacaranda', cols, M, scale=1.2)
# types: 'jacaranda', 'acacia', 'palm', 'generic'
```

### Render at Lower Quality (faster preview)
```python
scene.cycles.samples = 64  # change from 256
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
```

---

## 🏛️ NTSA Curriculum Coverage

This model supports all NTSA B1 licence training scenarios:

| Scenario | Model Element |
|----------|--------------|
| Traffic signal obedience | 10 signalised intersections |
| Speed limit compliance | Speed 50 signs in urban zone |
| Roundabout navigation | 2 roundabouts |
| Urban driving | Full CBD grid |
| Parking manoeuvres | Marked bays on side streets |
| Pedestrian awareness | Zebra crossings at all intersections |
| Hazard perception | Market stalls, matatus, parked vehicles |
| Road signs | STOP, YIELD, KEEP LEFT, NO OVERTAKE |

---

## 📞 Credits

Model based on openly available geographic data for Nairobi CBD.  
Built for educational use under the NTSA B1 Driving Training Programme.  
Script by NTSA Simulator Project — procedurally generated in Blender Python API.
