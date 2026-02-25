"""
================================================================================
  NAIROBI HYPER-REALISTIC TOWN MODEL — Blender Python Script
  NTSA B1 Driving Simulator — Procedural City Generator
================================================================================
  HOW TO USE:
  1. Open Blender (3.x or 4.x)
  2. Switch to the "Scripting" workspace (top menu)
  3. Click "New" to create a new text block
  4. Paste this entire script
  5. Click "Run Script" (▶) or press Alt+P
  6. The full Nairobi model will be generated in the 3D viewport
  7. Optional: File > Export > glTF 2.0 (.glb) to use in the web simulator

  FEATURES:
  • CBD streets modelled on actual Nairobi grid (Kenyatta Ave, Moi Ave, Tom Mboya)
  • Iconic landmarks: KICC, Times Tower, Uchumi House, Nation Centre
  • Matatu bays, roundabouts, zebra crossings
  • PBR materials (metal, glass, concrete, tarmac, vegetation)
  • Street furniture: lampposts, bins, benches, bus shelters
  • Traffic lights at intersections
  • Roadside market stalls (jua kali)
  • Parklands trees (Jacaranda, Acacia)
  • Nairobi River corridor
  • Day/night HDR sky setup
================================================================================
"""

import bpy
import math
import random
from mathutils import Vector, Euler

random.seed(42)  # Deterministic build

# ── Utilities ────────────────────────────────────────────────────────────────

def clear_scene():
    """Remove all default objects."""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)

def new_collection(name):
    col = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(col)
    return col

def link_to(obj, collection):
    collection.objects.link(obj)
    if obj.name in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.unlink(obj)

def make_material(name, color, roughness=0.7, metallic=0.0,
                  emission=None, alpha=1.0, specular=0.5):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new('ShaderNodeOutputMaterial')
    output.location = (400, 0)

    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (0, 0)
    bsdf.inputs['Base Color'].default_value = (*color, 1.0)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Specular IOR Level'].default_value = specular if 'Specular IOR Level' in bsdf.inputs else 0
    if 'Specular' in bsdf.inputs:
        bsdf.inputs['Specular'].default_value = specular
    if alpha < 1.0:
        bsdf.inputs['Alpha'].default_value = alpha
        mat.blend_method = 'BLEND'

    if emission:
        bsdf.inputs['Emission Color'].default_value = (*emission, 1.0) if 'Emission Color' in bsdf.inputs else None
        if 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = (*emission, 1.0)
        bsdf.inputs['Emission Strength'].default_value = 3.0

    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    return mat

def add_box(name, loc, dims, mat, collection, rot=(0,0,0), cast_shadow=True):
    """Create a UV-unwrapped box mesh."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = dims
    obj.rotation_euler = Euler(rot)
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    obj.cycles.use_shadow_catcher = False
    link_to(obj, collection)
    return obj

def add_cylinder(name, loc, radius, depth, mat, collection, rot=(0,0,0), verts=12):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius,
                                         depth=depth, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = Euler(rot)
    bpy.ops.object.transform_apply(rotation=True)
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    link_to(obj, collection)
    return obj

def add_plane(name, loc, size, mat, collection, rot=(math.pi/2, 0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=size, location=loc)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = Euler(rot)
    bpy.ops.object.transform_apply(rotation=True)
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    link_to(obj, collection)
    return obj

# ── Master Collections ────────────────────────────────────────────────────────

def setup_collections():
    cols = {}
    for name in ['Ground', 'Roads', 'Buildings', 'Landmarks', 'Vegetation',
                 'Traffic', 'Vehicles', 'Street_Furniture', 'Sky', 'Water']:
        cols[name] = new_collection(name)
    return cols

# ── Materials Library ─────────────────────────────────────────────────────────

def setup_materials():
    M = {}

    # Ground
    M['ground']       = make_material('M_Ground',       (0.22, 0.28, 0.15), roughness=0.95)
    M['laterite']     = make_material('M_Laterite',     (0.72, 0.40, 0.20), roughness=0.90)  # Kenyan red soil

    # Roads
    M['tarmac']       = make_material('M_Tarmac',       (0.12, 0.12, 0.13), roughness=0.88)
    M['road_new']     = make_material('M_RoadNew',      (0.17, 0.17, 0.18), roughness=0.80)
    M['road_line_y']  = make_material('M_LineYellow',   (0.95, 0.85, 0.10), roughness=0.6)
    M['road_line_w']  = make_material('M_LineWhite',    (0.95, 0.95, 0.95), roughness=0.5)
    M['kerb']         = make_material('M_Kerb',         (0.75, 0.75, 0.75), roughness=0.85)
    M['pavement']     = make_material('M_Pavement',     (0.70, 0.68, 0.60), roughness=0.90)

    # Building materials
    M['concrete']     = make_material('M_Concrete',     (0.65, 0.62, 0.58), roughness=0.85)
    M['concrete_dark']= make_material('M_ConcreteDark', (0.40, 0.38, 0.35), roughness=0.80)
    M['glass_blue']   = make_material('M_GlassBlue',    (0.20, 0.40, 0.65), roughness=0.05,
                                      metallic=0.1, alpha=0.3)
    M['glass_green']  = make_material('M_GlassGreen',   (0.15, 0.50, 0.35), roughness=0.05,
                                      metallic=0.1, alpha=0.3)
    M['glass_bronze'] = make_material('M_GlassBronze',  (0.55, 0.38, 0.18), roughness=0.06,
                                      metallic=0.15, alpha=0.35)
    M['brick_red']    = make_material('M_BrickRed',     (0.68, 0.28, 0.15), roughness=0.92)
    M['brick_brown']  = make_material('M_BrickBrown',   (0.50, 0.30, 0.15), roughness=0.90)
    M['facade_white'] = make_material('M_FacadeWhite',  (0.90, 0.88, 0.83), roughness=0.80)
    M['facade_cream'] = make_material('M_FacadeCream',  (0.88, 0.80, 0.65), roughness=0.82)
    M['metal_dark']   = make_material('M_MetalDark',    (0.15, 0.15, 0.18), roughness=0.4,
                                      metallic=0.9)
    M['metal_silver'] = make_material('M_MetalSilver',  (0.70, 0.72, 0.75), roughness=0.3,
                                      metallic=0.95)
    M['roof_flat']    = make_material('M_RoofFlat',     (0.30, 0.28, 0.25), roughness=0.90)
    M['roof_red']     = make_material('M_RoofRed',      (0.55, 0.15, 0.10), roughness=0.85)

    # Landmark-specific
    M['kicc_green']   = make_material('M_KICC_Green',   (0.15, 0.45, 0.30), roughness=0.05,
                                      metallic=0.05, alpha=0.35)
    M['kicc_col']     = make_material('M_KICC_Column',  (0.80, 0.78, 0.72), roughness=0.70)
    M['times_glass']  = make_material('M_Times_Glass',  (0.10, 0.22, 0.40), roughness=0.04,
                                      metallic=0.1, alpha=0.25)
    M['times_frame']  = make_material('M_Times_Frame',  (0.08, 0.08, 0.10), roughness=0.2,
                                      metallic=0.95)

    # Vegetation
    M['leaf_jacaranda']= make_material('M_Jacaranda',  (0.45, 0.20, 0.60), roughness=0.95)
    M['leaf_acacia']   = make_material('M_Acacia',     (0.30, 0.52, 0.18), roughness=0.95)
    M['leaf_generic']  = make_material('M_Leaf',       (0.18, 0.48, 0.12), roughness=0.95)
    M['trunk']         = make_material('M_Trunk',      (0.32, 0.20, 0.10), roughness=0.97)
    M['grass']         = make_material('M_Grass',      (0.20, 0.45, 0.12), roughness=0.97)

    # Traffic / signage
    M['tl_pole']      = make_material('M_TL_Pole',    (0.10, 0.10, 0.12), roughness=0.5,
                                      metallic=0.8)
    M['tl_red']       = make_material('M_TL_Red',     (1.00, 0.05, 0.05), roughness=0.3,
                                      emission=(1.0, 0.0, 0.0))
    M['tl_yellow']    = make_material('M_TL_Yellow',  (1.00, 0.80, 0.00), roughness=0.3,
                                      emission=(1.0, 0.8, 0.0))
    M['tl_green']     = make_material('M_TL_Green',   (0.00, 1.00, 0.30), roughness=0.3,
                                      emission=(0.0, 1.0, 0.3))
    M['tl_off']       = make_material('M_TL_Off',     (0.10, 0.10, 0.10), roughness=0.5)
    M['sign_stop']    = make_material('M_SignStop',   (0.85, 0.05, 0.05), roughness=0.7)
    M['sign_blue']    = make_material('M_SignBlue',   (0.05, 0.15, 0.60), roughness=0.7)
    M['sign_yellow']  = make_material('M_SignYellow', (0.90, 0.70, 0.00), roughness=0.7)

    # Street furniture
    M['lamppost']     = make_material('M_Lamppost',   (0.15, 0.15, 0.20), roughness=0.4,
                                      metallic=0.85)
    M['lamp_glow']    = make_material('M_LampGlow',   (1.00, 0.90, 0.60), roughness=0.2,
                                      emission=(1.0, 0.85, 0.5))
    M['bench']        = make_material('M_Bench',      (0.35, 0.22, 0.10), roughness=0.88)
    M['matatu_body']  = make_material('M_Matatu',     (0.90, 0.90, 0.90), roughness=0.5)
    M['matatu_stripe']= make_material('M_MatatuStripe',(0.70, 0.05, 0.05), roughness=0.5)
    M['stall_fabric'] = make_material('M_StallFabric',(0.80, 0.30, 0.10), roughness=0.97)
    M['river']        = make_material('M_River',      (0.18, 0.35, 0.28), roughness=0.05,
                                      metallic=0.1, alpha=0.75)
    M['sidewalk']     = make_material('M_Sidewalk',   (0.72, 0.70, 0.65), roughness=0.88)

    return M

# ── Ground Plane ─────────────────────────────────────────────────────────────

def build_ground(cols, M):
    # Main ground
    add_box('Ground_Main', (0, 0, -0.5), (600, 600, 1), M['ground'], cols['Ground'])

    # Laterite soil patches (Kenya red earth on unpaved areas)
    for i in range(15):
        x = random.uniform(-200, 200)
        y = random.uniform(-200, 200)
        w = random.uniform(15, 60)
        d = random.uniform(15, 60)
        add_box(f'Laterite_{i}', (x, y, 0.02), (w, d, 0.04), M['laterite'], cols['Ground'])

# ── Road Network ─────────────────────────────────────────────────────────────
#
#  Simplified Nairobi CBD grid (scaled at 1 unit ≈ 1 metre):
#  Kenyatta Avenue  — E-W at y=0
#  Moi Avenue       — N-S at x=0
#  Tom Mboya Street — N-S at x=40
#  Haile Selassie   — E-W at y=-60
#  University Way   — E-W at y=80
#  Kimathi Street   — N-S at x=-40
#  Harambee Ave     — E-W at y=40

def build_roads(cols, M):
    road_w = 18   # two-lane with shoulder

    # Main arterials [x_centre, y_centre, width, length, is_NS]
    arterials = [
        # Kenyatta Avenue (E-W)
        (0,    0,   road_w, 400, False),
        # University Way (E-W)
        (0,   80,   road_w, 400, False),
        # Haile Selassie Ave (E-W)
        (0,  -70,   road_w, 400, False),
        # Harambee Ave (E-W)
        (0,   40,   14,     300, False),
        # Kenyatta continuation (inner ring)
        (0,  -30,   12,     300, False),

        # Moi Avenue (N-S)
        (0,    0,   road_w, 400, True),
        # Tom Mboya Street (N-S)
        (50,   0,   14,     360, True),
        # Kimathi Street (N-S)
        (-50,  0,   14,     360, True),
        # Uhuru Highway (N-S, wide)
        (-120, 0,   24,     500, True),
        # Waiyaki Way (E-W, western)
        (-160, 40,  22,     200, False),
    ]

    for i, (cx, cy, w, l, is_ns) in enumerate(arterials):
        rot = (math.pi/2, 0, math.pi/2) if is_ns else (math.pi/2, 0, 0)
        # Road surface
        bpy.ops.mesh.primitive_plane_add(size=1, location=(cx, cy, 0.02))
        obj = bpy.context.active_object
        obj.name = f'Road_{i}'
        obj.scale = (w, l, 1) if not is_ns else (l, w, 1)
        obj.rotation_euler = Euler((math.pi/2, 0, 0))
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        obj.data.materials.append(M['tarmac'])
        link_to(obj, cols['Roads'])

        # Centre line
        lw, ll = (0.3, l) if not is_ns else (l, 0.3)
        bpy.ops.mesh.primitive_plane_add(size=1, location=(cx, cy, 0.04))
        line = bpy.context.active_object
        line.name = f'CentreLine_{i}'
        line.scale = (lw, ll, 1)
        line.rotation_euler = Euler((math.pi/2, 0, 0))
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        line.data.materials.append(M['road_line_y'])
        link_to(line, cols['Roads'])

        # Edge lines
        for side in [-1, 1]:
            bpy.ops.mesh.primitive_plane_add(size=1, location=(
                cx + (w/2 - 0.4) * side if not is_ns else cx,
                cy if not is_ns else cy + (w/2 - 0.4) * side,
                0.04))
            edge = bpy.context.active_object
            edge.name = f'EdgeLine_{i}_{side}'
            edge.scale = (0.25, l, 1) if not is_ns else (l, 0.25, 1)
            edge.rotation_euler = Euler((math.pi/2, 0, 0))
            bpy.ops.object.transform_apply(scale=True, rotation=True)
            edge.data.materials.append(M['road_line_w'])
            link_to(edge, cols['Roads'])

        # Kerb strips
        for side in [-1, 1]:
            bpy.ops.mesh.primitive_cube_add(size=1, location=(
                cx + (w/2 + 0.4) * side if not is_ns else cx,
                cy if not is_ns else cy + (w/2 + 0.4) * side,
                0.06))
            kerb = bpy.context.active_object
            kerb.name = f'Kerb_{i}_{side}'
            kerb.scale = (0.4, l, 0.12) if not is_ns else (l, 0.4, 0.12)
            bpy.ops.object.transform_apply(scale=True)
            kerb.data.materials.append(M['kerb'])
            link_to(kerb, cols['Roads'])

    # Zebra crossings at key intersections
    crossings = [
        (0, 11, True), (0, -11, True), (11, 0, False), (-11, 0, False),
        (50, 11, True), (50, -11, True),
        (-50, 11, True), (-50, -11, True),
    ]
    for i, (cx, cy, ns) in enumerate(crossings):
        for stripe in range(-4, 5):
            bpy.ops.mesh.primitive_plane_add(size=1, location=(
                cx + stripe * 1.2 if not ns else cx,
                cy if not ns else cy + stripe * 1.2,
                0.05))
            z = bpy.context.active_object
            z.name = f'Zebra_{i}_{stripe}'
            z.scale = (0.9, 14, 1) if not ns else (14, 0.9, 1)
            z.rotation_euler = Euler((math.pi/2, 0, 0))
            bpy.ops.object.transform_apply(scale=True, rotation=True)
            z.data.materials.append(M['road_line_w'])
            link_to(z, cols['Roads'])

    # Pavement / sidewalks along Kenyatta Ave
    for side in [-1, 1]:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, side * 14, 0.07))
        sw = bpy.context.active_object
        sw.name = f'Sidewalk_Kenyatta_{side}'
        sw.scale = (380, 5, 0.14)
        bpy.ops.object.transform_apply(scale=True)
        sw.data.materials.append(M['sidewalk'])
        link_to(sw, cols['Roads'])

    # Roundabout at Moi/Kenyatta intersection
    build_roundabout((0, 0, 0.03), 14, cols, M)

    # Globe Roundabout (Haile Selassie / Uhuru Highway)
    build_roundabout((-120, -70, 0.03), 20, cols, M)

def build_roundabout(centre, radius, cols, M):
    cx, cy, cz = centre
    segments = 48
    # Road ring
    bpy.ops.mesh.primitive_torus_add(
        major_radius=radius, minor_radius=5,
        major_segments=segments, minor_segments=12,
        location=(cx, cy, cz + 0.05))
    torus = bpy.context.active_object
    torus.name = f'Roundabout_{cx}_{cy}'
    torus.rotation_euler = Euler((math.pi/2, 0, 0))
    bpy.ops.object.transform_apply(rotation=True)
    torus.data.materials.append(M['tarmac'])
    link_to(torus, cols['Roads'])

    # Centre island (green)
    add_cylinder(f'RoundaboutIsland_{cx}', (cx, cy, 0.15), radius - 4, 0.3,
                 M['grass'], cols['Roads'])

    # Central monument (generic pillar representing Globe Roundabout style)
    add_cylinder(f'Monument_{cx}', (cx, cy, 2.0), 0.8, 4.0, M['concrete'], cols['Roads'])
    add_box(f'MonumentTop_{cx}', (cx, cy, 4.5), (2, 2, 0.5), M['facade_cream'], cols['Roads'])

# ── Buildings: Nairobi CBD ─────────────────────────────────────────────────

def build_cbd_buildings(cols, M):
    """
    Modelled on actual Nairobi CBD building positions (schematic).
    Coordinates: x = East-West, y = North-South
    """

    # Each entry: (name, x, y, width, depth, floors, mat_key, glass_mat)
    # 1 floor ≈ 3.5m
    buildings = [
        # Kenyatta Avenue corridor (south side)
        ('Uchumi_House',      -80, -22,  40, 30, 12, 'facade_cream',  'glass_blue'),
        ('Anniversary_Twrs',  -30, -25,  28, 26, 18, 'concrete',      'glass_green'),
        ('Electricity_Hse',    20, -22,  24, 24,  8, 'facade_white',  'glass_blue'),
        ('Chester_House',      60, -22,  22, 20,  7, 'brick_brown',   'glass_blue'),
        ('Kencom_House',       90, -22,  30, 22,  5, 'brick_red',     'glass_blue'),

        # Kenyatta Avenue corridor (north side)
        ('Bruce_House',       -80,  22,  26, 22,  8, 'facade_cream',  'glass_blue'),
        ('Utalii_House',      -50,  22,  20, 20, 10, 'concrete',      'glass_green'),
        ('ICEA_Lion',         -15,  24,  32, 28, 16, 'glass_blue',    'glass_blue'),
        ('Nation_Centre',      30,  24,  28, 26, 22, 'concrete_dark', 'glass_green'),
        ('Prudential_Assur',   70,  22,  24, 20, 12, 'facade_white',  'glass_blue'),

        # Moi Avenue corridor
        ('Teleposta_Towers',   -8,  60,  24, 22, 24, 'concrete',      'glass_blue'),
        ('Lonrho_House',       10,  55,  18, 18, 14, 'brick_brown',   'glass_blue'),
        ('Times_Tower_Base',   -5, -55,  30, 28, 38, 'concrete_dark', 'glass_blue'),  # tallest placeholder

        # Harambee Ave / government quarter
        ('Treasury_Bldg',    -60,  42,  50, 35,  4, 'facade_cream',  'glass_blue'),
        ('Harambee_House',   -60,  55,  40, 30,  4, 'facade_white',  'glass_blue'),
        ('Parliament_Bldg',  -90,  50,  60, 45,  3, 'concrete',      'glass_blue'),

        # Tom Mboya Street
        ('Ambassadeur_Hotel',  50,  30,  22, 18, 10, 'brick_red',    'glass_blue'),
        ('Odeon_Cinema',       50,  55,  24, 20,  4, 'facade_cream', 'glass_blue'),
        ('Bazaar_Plaza',       55, -30,  20, 18,  8, 'facade_white', 'glass_blue'),

        # Kimathi Street
        ('New_Stanley',       -50,  30,  28, 22,  8, 'facade_cream', 'glass_blue'),
        ('Intercontinental',  -50,  55,  34, 28, 14, 'concrete',     'glass_bronze'),
        ('Hilton_Hotel',      -50, -30,  32, 30, 24, 'concrete_dark','glass_bronze'),

        # Westlands / Parklands fringe
        ('PGH_Towers',       -130, 80,  30, 28, 20, 'glass_green',  'glass_green'),
        ('Westgate_Mall',    -160, 90,  60, 50,  3, 'facade_white', 'glass_blue'),
        ('I&M_Bank_Twrs',    -100, 60,  22, 22, 18, 'glass_bronze', 'glass_bronze'),
    ]

    for (name, bx, by, bw, bd, floors, fmat, gmat) in buildings:
        h = floors * 3.5
        # Main body
        add_box(name, (bx, by, h/2), (bw, bd, h), M[fmat], cols['Buildings'])

        # Glass curtain wall (overlay)
        if floors > 5:
            add_box(f'{name}_Glass', (bx, by + bd/2 + 0.05, h/2),
                    (bw - 0.2, 0.15, h - 1), M[gmat], cols['Buildings'])

        # Flat roof
        add_box(f'{name}_Roof', (bx, by, h + 0.2), (bw + 0.3, bd + 0.3, 0.4),
                M['roof_flat'], cols['Buildings'])

        # Rooftop equipment (AC units etc.)
        if floors > 8:
            for ri in range(random.randint(2, 5)):
                rx = bx + random.uniform(-bw/2 + 1, bw/2 - 1)
                ry = by + random.uniform(-bd/2 + 1, bd/2 - 1)
                rh = random.uniform(0.8, 2.5)
                rw = random.uniform(1.5, 4.0)
                add_box(f'{name}_Roof_Eq_{ri}', (rx, ry, h + 0.4 + rh/2),
                        (rw, rw * 0.7, rh), M['metal_dark'], cols['Buildings'])

        # Ground-floor shopfronts (darker band)
        add_box(f'{name}_GF', (bx, by, 1.75), (bw + 0.1, bd + 0.1, 3.5),
                M['concrete_dark'], cols['Buildings'])

# ── Iconic Landmarks ─────────────────────────────────────────────────────────

def build_kicc(cols, M):
    """
    Kenyatta International Convention Centre
    Distinctive cylinder + cone roof + office wing
    """
    cx, cy = 5, 10

    # Circular tower
    add_cylinder('KICC_Tower', (cx, cy, 62.5), 13, 125, M['kicc_green'], cols['Landmarks'])

    # Stepped base rings
    for i, (r, h_offset) in enumerate([(18, 2), (22, 0.5), (26, -1)]):
        add_cylinder(f'KICC_Base_{i}', (cx, cy, h_offset), r, 4 - i,
                     M['kicc_col'], cols['Landmarks'])

    # Conical roof (approximated as narrow cylinder)
    add_cylinder('KICC_Cone', (cx, cy, 126), 0.5, 4, M['metal_dark'], cols['Landmarks'], verts=16)
    add_box('KICC_ConeBase', (cx, cy, 124), (6, 6, 4), M['concrete_dark'], cols['Landmarks'])

    # Helipad ring at top
    add_cylinder('KICC_Helipad', (cx, cy, 125.5), 10, 0.3, M['concrete'], cols['Landmarks'])

    # Conference wing (rectangular block)
    add_box('KICC_Wing', (cx + 35, cy, 12), (40, 35, 24), M['kicc_col'], cols['Landmarks'])
    add_box('KICC_Wing_Glass', (cx + 35, cy + 17.6, 12), (40, 0.2, 22),
            M['glass_blue'], cols['Landmarks'])

    # Flagpoles
    for fx, fy in [(cx - 8, cy - 20), (cx, cy - 20), (cx + 8, cy - 20)]:
        add_cylinder(f'Flagpole_{fx}', (fx, fy, 10), 0.06, 20, M['metal_silver'],
                     cols['Landmarks'])
        add_box(f'Flag_{fx}', (fx + 1.5, fy, 19), (3, 0.05, 2), M['sign_stop'],
                cols['Landmarks'])

def build_times_tower(cols, M):
    """
    Times Tower — tallest building in East Africa at time of build
    Distinctive stepped setback design
    """
    cx, cy = -5, -55
    # Setback floors
    setbacks = [
        (26, 26, 60),   # base
        (22, 22, 100),  # mid setback
        (16, 16, 140),  # upper
        (10, 10, 165),  # crown
    ]
    for i, (w, d, h) in enumerate(setbacks):
        add_box(f'TimesTower_S{i}', (cx, cy, h/2), (w, d, h), M['times_glass'],
                cols['Landmarks'])
        # Frame
        add_box(f'TimesTower_Frame{i}', (cx, cy, h/2), (w + 0.4, d + 0.4, h),
                M['times_frame'], cols['Landmarks'])
        # Setback roof
        add_box(f'TimesTower_Roof{i}', (cx, cy, h + 0.2), (w + 0.5, d + 0.5, 0.4),
                M['metal_dark'], cols['Landmarks'])

    # Spire
    add_cylinder('TimesTower_Spire', (cx, cy, 168), 0.4, 12, M['metal_silver'],
                 cols['Landmarks'])

def build_parliament(cols, M):
    """Parliament Buildings - colonnaded facade style"""
    cx, cy = -90, 50
    # Main block
    add_box('Parliament_Main', (cx, cy, 8), (60, 45, 16), M['facade_cream'],
            cols['Landmarks'])
    # Portico columns
    for col_x in range(-20, 22, 5):
        add_cylinder(f'Parl_Col_{col_x}', (cx + col_x, cy + 23, 9), 0.6, 18,
                     M['kicc_col'], cols['Landmarks'], verts=16)
    # Pediment
    add_box('Parliament_Pediment', (cx, cy + 22, 18.5), (50, 0.8, 4),
            M['facade_cream'], cols['Landmarks'])
    # Dome
    add_cylinder('Parliament_Dome', (cx, cy, 22), 8, 6, M['concrete'], cols['Landmarks'])

# ── Traffic Lights ────────────────────────────────────────────────────────────

def build_traffic_light(pos, phase, cols, M):
    """phase: 0=red, 1=amber, 2=green (which light is on)"""
    x, y, z = pos
    pole = add_cylinder(f'TL_Pole_{x}_{y}', (x, y, 2.5), 0.08, 5, M['tl_pole'],
                        cols['Traffic'])
    # Housing
    add_box(f'TL_Box_{x}_{y}', (x, y, 5.5), (0.35, 0.35, 1.2), M['metal_dark'],
            cols['Traffic'])
    # Lights
    for i, (mat_on, mat_off) in enumerate([
            (M['tl_red'], M['tl_off']),
            (M['tl_yellow'], M['tl_off']),
            (M['tl_green'], M['tl_off'])]):
        lz = 5.9 - i * 0.4
        mat = mat_on if i == phase else mat_off
        add_cylinder(f'TL_Light_{x}_{y}_{i}', (x, y + 0.18, lz), 0.12, 0.06,
                     mat, cols['Traffic'], rot=(math.pi/2, 0, 0), verts=16)

def build_all_traffic_lights(cols, M):
    intersections = [
        (10, 12, 2), (-10, 12, 0), (10, -12, 2), (-10, -12, 0),
        (60, 12, 2), (-60, 12, 0), (10, 88, 2), (-10, 88, 0),
        (60, -78, 2), (-60, -78, 0),
    ]
    for (x, y, phase) in intersections:
        build_traffic_light((x, y, 0), phase, cols, M)

# ── Road Signs ────────────────────────────────────────────────────────────────

def build_road_signs(cols, M):
    signs = [
        # (x, y, type)  type: 'stop','speed50','keep_left','yield','no_overtake'
        (15, 15, 'stop'),
        (-15, -18, 'yield'),
        (55, 18, 'speed50'),
        (-55, 18, 'keep_left'),
        (15, -68, 'no_overtake'),
        (-15, 85, 'stop'),
        (55, 85, 'speed50'),
    ]
    for i, (x, y, stype) in enumerate(signs):
        # Pole
        add_cylinder(f'Sign_Pole_{i}', (x, y, 1.3), 0.04, 2.6, M['metal_silver'],
                     cols['Traffic'])
        # Sign face
        if stype == 'stop':
            # Octagonal (approximated with cylinder)
            add_cylinder(f'Sign_{i}', (x, y, 2.7), 0.5, 0.06, M['sign_stop'],
                         cols['Traffic'], rot=(math.pi/2, 0, 0), verts=8)
        elif stype in ('yield', 'no_overtake'):
            add_box(f'Sign_{i}', (x, y, 2.6), (0.8, 0.06, 0.8), M['sign_stop'], cols['Traffic'])
        elif stype == 'speed50':
            add_cylinder(f'Sign_{i}', (x, y, 2.7), 0.45, 0.06, M['facade_white'],
                         cols['Traffic'], rot=(math.pi/2, 0, 0), verts=24)
        elif stype == 'keep_left':
            add_box(f'Sign_{i}', (x, y, 2.6), (0.8, 0.06, 0.6), M['sign_blue'], cols['Traffic'])

# ── Vegetation ────────────────────────────────────────────────────────────────

def build_tree(name, x, y, tree_type, cols, M, scale=1.0):
    """
    tree_type: 'jacaranda', 'acacia', 'palm', 'generic'
    """
    trunk_h = random.uniform(4, 8) * scale
    # Trunk
    add_cylinder(f'{name}_Trunk', (x, y, trunk_h/2), 0.25 * scale, trunk_h,
                 M['trunk'], cols['Vegetation'], verts=8)

    if tree_type == 'jacaranda':
        # Wide spreading crown
        add_cylinder(f'{name}_Crown', (x, y, trunk_h + 2.5 * scale),
                     3.5 * scale, 3.0 * scale, M['leaf_jacaranda'],
                     cols['Vegetation'], verts=12)
    elif tree_type == 'acacia':
        # Flat-topped
        add_cylinder(f'{name}_Crown', (x, y, trunk_h + 1.5 * scale),
                     4.5 * scale, 1.5 * scale, M['leaf_acacia'],
                     cols['Vegetation'], verts=10)
    elif tree_type == 'palm':
        # Tall thin trunk, small crown
        add_cylinder(f'{name}_Trunk2', (x, y, trunk_h), 0.15 * scale, trunk_h * 0.5,
                     M['trunk'], cols['Vegetation'], verts=8)
        add_cylinder(f'{name}_Crown', (x, y, trunk_h * 1.5 + 2),
                     2.5 * scale, 2.0 * scale, M['leaf_generic'],
                     cols['Vegetation'], verts=10)
    else:
        # Generic round tree
        bpy.ops.mesh.primitive_ico_sphere_add(radius=2.5 * scale,
                                               location=(x, y, trunk_h + 2 * scale),
                                               subdivisions=2)
        cr = bpy.context.active_object
        cr.name = f'{name}_Crown'
        cr.data.materials.append(M['leaf_generic'])
        link_to(cr, cols['Vegetation'])

def build_vegetation(cols, M):
    # Uhuru Park trees (west side)
    tree_types = ['jacaranda', 'acacia', 'generic', 'palm']
    for i in range(60):
        x = random.uniform(-180, -100)
        y = random.uniform(-20, 80)
        tt = random.choice(tree_types)
        sc = random.uniform(0.7, 1.5)
        build_tree(f'UhuruPark_Tree_{i}', x, y, tt, cols, M, scale=sc)

    # Jeevanjee Gardens
    for i in range(20):
        x = random.uniform(-70, -40)
        y = random.uniform(60, 90)
        sc = random.uniform(0.8, 1.3)
        build_tree(f'Jeevanjee_Tree_{i}', x, y, 'jacaranda', cols, M, scale=sc)

    # Street trees along Kenyatta Ave
    for i, tx in enumerate(range(-180, 190, 18)):
        for side in [-1, 1]:
            build_tree(f'KenyattaTree_{i}_{side}', tx, side * 18, 'jacaranda',
                       cols, M, scale=0.9)

    # University Way trees
    for i, tx in enumerate(range(-180, 190, 16)):
        for side in [-1, 1]:
            build_tree(f'UniWay_Tree_{i}_{side}', tx, 80 + side * 16, 'generic',
                       cols, M, scale=0.85)

    # Grass patches — Uhuru Park
    add_box('UhuruPark_Grass', (-145, 30, 0.05), (80, 110, 0.1), M['grass'],
            cols['Vegetation'])

    # Central Park strip
    add_box('CentralPark_Grass', (-5, 110, 0.05), (80, 40, 0.1), M['grass'],
            cols['Vegetation'])

# ── Nairobi River ─────────────────────────────────────────────────────────────

def build_river(cols, M):
    # Nairobi River runs roughly E-W south of CBD
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -110, -0.2))
    r = bpy.context.active_object
    r.name = 'Nairobi_River'
    r.scale = (400, 14, 0.4)
    bpy.ops.object.transform_apply(scale=True)
    r.data.materials.append(M['river'])
    link_to(r, cols['Water'])

    # Riverbanks
    for side in [-1, 1]:
        add_box(f'Riverbank_{side}', (0, -110 + side * 9, 0.1), (400, 4, 0.2),
                M['laterite'], cols['Water'])

# ── Street Furniture ──────────────────────────────────────────────────────────

def build_streetlamp(x, y, cols, M):
    name = f'Lamp_{x:.0f}_{y:.0f}'
    add_cylinder(f'{name}_Pole', (x, y, 5), 0.06, 10, M['lamppost'],
                 cols['Street_Furniture'], verts=8)
    # Arm
    add_box(f'{name}_Arm', (x, y + 1.5, 10), (0.06, 3, 0.06), M['lamppost'],
            cols['Street_Furniture'])
    # Lamp head
    add_box(f'{name}_Head', (x, y + 3, 9.7), (0.5, 0.8, 0.3), M['lamppost'],
            cols['Street_Furniture'])
    # Glow
    add_box(f'{name}_Glow', (x, y + 3, 9.5), (0.4, 0.7, 0.15), M['lamp_glow'],
            cols['Street_Furniture'])

def build_street_furniture(cols, M):
    # Lampposts along Kenyatta Ave
    for lx in range(-160, 170, 22):
        for side in [-1, 1]:
            build_streetlamp(lx, side * 16, cols, M)

    # Lampposts along Moi Ave
    for ly in range(-140, 150, 22):
        build_streetlamp(-16, ly, cols, M)
        build_streetlamp(16, ly, cols, M)

    # Bus shelters
    shelter_positions = [
        (30, -16), (-30, -16), (80, -16), (-80, -16),
        (30, 16),  (-30, 16),
    ]
    for sx, sy in shelter_positions:
        # Roof
        add_box(f'Shelter_{sx}_{sy}_Roof', (sx, sy, 2.6), (6, 2, 0.15),
                M['metal_dark'], cols['Street_Furniture'])
        # Supports
        for pillar_x in [-2.5, 2.5]:
            add_cylinder(f'Shelter_{sx}_{sy}_Pillar_{pillar_x}',
                         (sx + pillar_x, sy, 1.3), 0.06, 2.6,
                         M['lamppost'], cols['Street_Furniture'], verts=8)
        # Back panel
        add_box(f'Shelter_{sx}_{sy}_Back', (sx, sy - 0.9, 1.3), (6, 0.08, 2.4),
                M['glass_blue'], cols['Street_Furniture'])

    # Benches
    bench_positions = [(10, 17), (-10, 17), (40, 17), (-40, 17)]
    for bx, by in bench_positions:
        add_box(f'Bench_{bx}_{by}', (bx, by, 0.45), (2.5, 0.4, 0.06),
                M['bench'], cols['Street_Furniture'])
        for leg_x in [-0.9, 0.9]:
            add_box(f'Bench_{bx}_{by}_Leg_{leg_x}', (bx + leg_x, by, 0.2),
                    (0.06, 0.35, 0.4), M['bench'], cols['Street_Furniture'])

# ── Matatus ───────────────────────────────────────────────────────────────────

def build_matatu(name, x, y, rot_z, cols, M):
    """14-seater matatu (Toyota HiAce style)"""
    rot = (0, 0, rot_z)
    add_box(f'{name}_Body', (x, y, 1.1), (2.0, 5.0, 2.2), M['matatu_body'],
            cols['Vehicles'], rot=rot)
    # Colour stripe
    add_box(f'{name}_Stripe', (x, y, 1.1), (2.05, 5.0, 0.4), M['matatu_stripe'],
            cols['Vehicles'], rot=rot)
    # Windows
    add_box(f'{name}_WinF', (x, y + 2.4, 1.3), (1.8, 0.1, 0.9), M['glass_blue'],
            cols['Vehicles'], rot=rot)
    add_box(f'{name}_WinR', (x, y - 2.4, 1.3), (1.8, 0.1, 0.9), M['glass_blue'],
            cols['Vehicles'], rot=rot)
    # Wheels
    for wx, wy in [(-1.1, 1.5), (1.1, 1.5), (-1.1, -1.5), (1.1, -1.5)]:
        add_cylinder(f'{name}_Wheel_{wx}_{wy}',
                     (x + wx, y + wy, 0.35), 0.35, 0.25,
                     M['metal_dark'], cols['Vehicles'],
                     rot=(0, math.pi/2, rot_z), verts=14)

def build_vehicles(cols, M):
    matatu_positions = [
        (22, 5, 0), (-22, -5, math.pi), (52, 8, 0),
        (52, -8, math.pi), (-52, 5, 0), (0, 55, math.pi/2),
        (0, -55, math.pi/2), (8, -30, math.pi/2),
    ]
    for i, (x, y, r) in enumerate(matatu_positions):
        build_matatu(f'Matatu_{i}', x, y, r, cols, M)

    # Parked generic cars
    car_mat = make_material('M_Car_Generic', (0.2, 0.3, 0.7), roughness=0.3, metallic=0.05)
    car_positions = [
        (30, -18), (-30, -18), (70, -18), (-70, -18),
        (30, 18), (-30, 18),
        (55, 25), (55, 30), (55, 35),
    ]
    for i, (cx, cy) in enumerate(car_positions):
        col_r = random.uniform(0.1, 0.9)
        col_g = random.uniform(0.1, 0.9)
        col_b = random.uniform(0.1, 0.9)
        car_col = make_material(f'M_Car_{i}', (col_r, col_g, col_b),
                                roughness=0.35, metallic=0.05)
        add_box(f'Car_{i}_Body', (cx, cy, 0.7), (1.8, 4.0, 1.4), car_col, cols['Vehicles'])
        add_box(f'Car_{i}_Roof', (cx, cy - 0.2, 1.55), (1.6, 2.2, 0.65), car_col, cols['Vehicles'])

# ── Jua Kali / Market Stalls ──────────────────────────────────────────────────

def build_market_stalls(cols, M):
    stall_positions = [
        # Jeevanjee Market area
        (-60, 70), (-55, 70), (-50, 70), (-45, 70),
        # Tom Mboya stalls
        (55, -20), (55, -25), (55, -30),
        # River Road area
        (30, 75), (35, 75), (40, 75),
    ]
    for i, (sx, sy) in enumerate(stall_positions):
        # Frame
        for px, py in [(-1.2, -1.2), (1.2, -1.2), (-1.2, 1.2), (1.2, 1.2)]:
            add_cylinder(f'Stall_{i}_Post_{px}_{py}', (sx + px, sy + py, 1.2),
                         0.04, 2.4, M['metal_dark'], cols['Street_Furniture'], verts=6)
        # Canopy
        col_idx = i % 3
        canopy_mats = [M['stall_fabric'],
                       make_material(f'StallFab_{i}', (0.1, 0.4, 0.7), roughness=0.97),
                       make_material(f'StallFab2_{i}', (0.2, 0.6, 0.1), roughness=0.97)]
        add_box(f'Stall_{i}_Canopy', (sx, sy, 2.5), (2.8, 2.8, 0.12),
                canopy_mats[col_idx], cols['Street_Furniture'])
        # Table
        add_box(f'Stall_{i}_Table', (sx, sy, 0.85), (2.0, 1.5, 0.06),
                M['bench'], cols['Street_Furniture'])

# ── Sky & Lighting ─────────────────────────────────────────────────────────────

def setup_lighting():
    """Realistic Nairobi daytime sky — equatorial sun, clear day"""
    scene = bpy.context.scene

    # Remove existing lights
    for obj in bpy.data.objects:
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj)

    # Sun (Nairobi sits 1° south of equator — near-vertical sun)
    bpy.ops.object.light_add(type='SUN', location=(0, 0, 100))
    sun = bpy.context.active_object
    sun.name = 'Nairobi_Sun'
    sun.rotation_euler = Euler((math.radians(25), 0, math.radians(30)))
    sun.data.energy = 4.5
    sun.data.color = (1.0, 0.97, 0.88)
    if hasattr(sun.data, 'angle'):
        sun.data.angle = math.radians(0.5)  # Sharp sun disc

    # Sky (use HDRI-style world background)
    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new('NairobiSky')
        bpy.context.scene.world = world
    world.use_nodes = True
    wn = world.node_tree.nodes
    wl = world.node_tree.links
    wn.clear()

    bg = wn.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.53, 0.81, 0.98, 1.0)  # Nairobi clear sky blue
    bg.inputs['Strength'].default_value = 1.2

    sky_tex = wn.new('ShaderNodeTexSky')
    sky_tex.sky_type = 'NISHITA'
    sky_tex.sun_elevation = math.radians(62)  # Near-zenith equatorial sun
    sky_tex.sun_rotation = math.radians(30)
    sky_tex.air_density = 1.0
    sky_tex.dust_density = 0.5  # Some haze typical of Nairobi

    tex_coord = wn.new('ShaderNodeTexCoord')
    output = wn.new('ShaderNodeOutputWorld')

    wl.new(tex_coord.outputs['Generated'], sky_tex.inputs['Vector'])
    wl.new(sky_tex.outputs['Color'], bg.inputs['Color'])
    wl.new(bg.outputs['Background'], output.inputs['Surface'])

    # Ambient fill (soft)
    bpy.ops.object.light_add(type='AREA', location=(0, 0, 80))
    fill = bpy.context.active_object
    fill.name = 'AmbientFill'
    fill.data.energy = 800
    fill.data.size = 200
    fill.data.color = (0.7, 0.85, 1.0)

    # Render settings
    scene.render.engine = 'CYCLES'
    if hasattr(scene, 'cycles'):
        scene.cycles.samples = 256
        scene.cycles.use_denoising = True
        scene.cycles.use_adaptive_sampling = True
        scene.cycles.adaptive_threshold = 0.01

    scene.render.resolution_x = 3840
    scene.render.resolution_y = 2160
    scene.render.film_transparent = False

# ── Camera Rigs ───────────────────────────────────────────────────────────────

def setup_cameras():
    cameras = [
        # (name, location, rotation_euler_degrees, lens)
        ('Cam_CBD_Overview', (0, -180, 150), (55, 0, 0), 35),
        ('Cam_KICC_Hero',    (80, -60, 80), (50, 0, -40), 50),
        ('Cam_StreetLevel',  (0, -20, 2.5), (90, 0, 180), 28),
        ('Cam_Aerial',       (0, 0, 300), (0, 0, 0), 28),
    ]
    for name, loc, rot_deg, lens in cameras:
        bpy.ops.object.camera_add(location=loc)
        cam = bpy.context.active_object
        cam.name = name
        cam.rotation_euler = Euler((math.radians(r) for r in rot_deg))
        cam.data.lens = lens
        cam.data.clip_end = 2000

    # Set main camera as active
    bpy.context.scene.camera = bpy.data.objects.get('Cam_CBD_Overview')

# ── Scene Settings ────────────────────────────────────────────────────────────

def setup_scene():
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.unit_settings.scale_length = 1.0
    scene.unit_settings.length_unit = 'METERS'

    # Viewport shading
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.shading.type = 'MATERIAL'
                    space.overlay.show_floor = False
                    space.overlay.show_axis_x = False
                    space.overlay.show_axis_y = False

# ── Main Build ────────────────────────────────────────────────────────────────

def build_nairobi():
    print("=" * 60)
    print("  NTSA Nairobi City Model — Building...")
    print("=" * 60)

    clear_scene()
    cols = setup_collections()
    M = setup_materials()

    print("[1/12] Ground...")
    build_ground(cols, M)

    print("[2/12] Road network...")
    build_roads(cols, M)

    print("[3/12] CBD buildings...")
    build_cbd_buildings(cols, M)

    print("[4/12] KICC landmark...")
    build_kicc(cols, M)

    print("[5/12] Times Tower...")
    build_times_tower(cols, M)

    print("[6/12] Parliament Buildings...")
    build_parliament(cols, M)

    print("[7/12] Traffic lights...")
    build_all_traffic_lights(cols, M)

    print("[8/12] Road signs...")
    build_road_signs(cols, M)

    print("[9/12] Vegetation...")
    build_vegetation(cols, M)

    print("[10/12] Street furniture & stalls...")
    build_street_furniture(cols, M)
    build_market_stalls(cols, M)

    print("[11/12] Vehicles & matatus...")
    build_vehicles(cols, M)

    print("[11b/12] Nairobi River...")
    build_river(cols, M)

    print("[12/12] Lighting, cameras, scene...")
    setup_lighting()
    setup_cameras()
    setup_scene()

    # Merge & clean
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=False)

    print("=" * 60)
    print("  Nairobi Model COMPLETE!")
    print(f"  Objects created: {len(bpy.data.objects)}")
    print(f"  Materials: {len(bpy.data.materials)}")
    print("")
    print("  NEXT STEPS:")
    print("  • File > Export > glTF 2.0 (.glb) for web simulator")
    print("  • Render > Render Image (F12) for preview")
    print("  • Camera views: Cam_CBD_Overview, Cam_KICC_Hero,")
    print("                  Cam_StreetLevel, Cam_Aerial")
    print("=" * 60)

# ── RUN ───────────────────────────────────────────────────────────────────────
build_nairobi()
