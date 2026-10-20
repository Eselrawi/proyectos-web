"""
Render de descenso por el tronco de island_tree_01 para el herbolario.
La cámara baja de la copa a las raíces, con un parallax lateral suave.
Uso:
  blender -b assets/modelos/island_tree_01_1k.blend -P tools/blender/render_turntable.py -- \
    --out assets/renders/frames --frames 120 --res 1600 --samples 96 --test
"""
import bpy
import sys
import math
import os
import mathutils

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []


def arg(name, default, cast=str):
    if name in argv:
        return cast(argv[argv.index(name) + 1])
    return default


OUT_DIR = os.path.abspath(arg('--out', 'assets/renders/frames'))
N_FRAMES = arg('--frames', 120, int)
RES = arg('--res', 1600, int)
SAMPLES = arg('--samples', 96, int)
TEST = '--test' in argv
TEST_INDICES = [int(x) for x in arg('--test-at', '0,40,80').split(',')]

HDRI_DAY = 'src/assets/tree/sky_day.hdr'
SUN_DAY = mathutils.Vector((0.5320169632538652, 0.7443470722099339, 0.4036153947790333)).normalized()

os.makedirs(OUT_DIR, exist_ok=True)

# ---------- limpiar: solo el mesh final LOD0, fuera los generadores y LOD1 ----------
KEEP = {'island_tree_01_LOD0'}
for o in list(bpy.data.objects):
    if o.type in ('MESH',) and o.name not in KEEP:
        o.hide_render = True
        o.hide_set(True)
    elif o.type == 'MESH' and o.name in KEEP:
        o.hide_render = False
        o.hide_set(False)

tree = bpy.data.objects['island_tree_01_LOD0']

# ---------- bounding box del árbol visible ----------
minv = mathutils.Vector((1e9, 1e9, 1e9))
maxv = mathutils.Vector((-1e9, -1e9, -1e9))
for corner in tree.bound_box:
    w = tree.matrix_world @ mathutils.Vector(corner)
    minv.x, minv.y, minv.z = min(minv.x, w.x), min(minv.y, w.y), min(minv.z, w.z)
    maxv.x, maxv.y, maxv.z = max(maxv.x, w.x), max(maxv.y, w.y), max(maxv.z, w.z)

center = (minv + maxv) / 2
height = maxv.z - minv.z
radius_xy = max(maxv.x - minv.x, maxv.y - minv.y) / 2
ground_z = minv.z

# ---------- limpiar luces/cámaras previas ----------
for o in list(bpy.data.objects):
    if o.type in ('LIGHT', 'CAMERA'):
        bpy.data.objects.remove(o, do_unlink=True)

# ---------- mundo: HDRI cálido como luz ambiente ----------
world = bpy.data.worlds.new('TreeWorld')
bpy.context.scene.world = world
world.use_nodes = True
nt = world.node_tree
nt.nodes.clear()
out = nt.nodes.new('ShaderNodeOutputWorld')
bg = nt.nodes.new('ShaderNodeBackground')
env = nt.nodes.new('ShaderNodeTexEnvironment')
hdri_path = os.path.abspath(HDRI_DAY)
env.image = bpy.data.images.load(hdri_path)
mapping = nt.nodes.new('ShaderNodeMapping')
coord = nt.nodes.new('ShaderNodeTexCoord')
nt.links.new(coord.outputs['Generated'], mapping.inputs['Vector'])
nt.links.new(mapping.outputs['Vector'], env.inputs['Vector'])
nt.links.new(env.outputs['Color'], bg.inputs['Color'])
bg.inputs['Strength'].default_value = 0.9
nt.links.new(bg.outputs['Background'], out.inputs['Surface'])

# ---------- sol cálido, sombras suaves ----------
sun_data = bpy.data.lights.new('KeySun', type='SUN')
sun_data.energy = 3.2
sun_data.color = (1.0, 0.92, 0.78)
sun_data.angle = math.radians(4.0)  # tamaño angular -> penumbra suave
sun = bpy.data.objects.new('KeySun', sun_data)
bpy.context.collection.objects.link(sun)
sun_dir = -SUN_DAY  # el sol "mira" hacia donde viene la luz
sun.rotation_euler = sun_dir.to_track_quat('-Z', 'Y').to_euler()

# ---------- suelo: shadow catcher ----------
ground_size = max(radius_xy * 6, 6)
bpy.ops.mesh.primitive_plane_add(size=ground_size, location=(center.x, center.y, ground_z))
ground = bpy.context.active_object
ground.name = 'ShadowGround'
ground.is_shadow_catcher = True
mat = bpy.data.materials.new('GroundCatcher')
mat.use_nodes = True
ground.data.materials.append(mat)


# ---------- cartel OPEN / CLOSED, colgado cerca de la bifurcación del tronco ----------
def face_matrix(local_x, local_y, local_z):
    return mathutils.Matrix((local_x, local_y, local_z)).transposed().to_4x4()


def add_sign():
    sign_pos = mathutils.Vector((
        center.x + radius_xy * 0.18,
        center.y - radius_xy * 0.12,
        ground_z + height * 0.32,
    ))

    wood = bpy.data.materials.new('SignWood')
    wood.use_nodes = True
    wood.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.22, 0.14, 0.07, 1)
    wood.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.8

    paint = bpy.data.materials.new('SignPaint')
    paint.use_nodes = True
    paint.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.93, 0.9, 0.81, 1)
    paint.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.45

    plank_w, plank_t, plank_h = 0.34, 0.022, 0.16
    bpy.ops.mesh.primitive_cube_add(size=1, location=sign_pos)
    plank = bpy.context.active_object
    plank.name = 'SignPlank'
    plank.scale = (plank_w / 2, plank_t / 2, plank_h / 2)
    plank.data.materials.append(wood)

    rope_mat = bpy.data.materials.new('SignRope')
    rope_mat.use_nodes = True
    rope_mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.55, 0.47, 0.34, 1)
    hang_z = ground_z + height * 0.4
    for side in (-1, 1):
        x = sign_pos.x + side * plank_w * 0.38
        top = mathutils.Vector((x, sign_pos.y, hang_z))
        bottom = mathutils.Vector((x, sign_pos.y, sign_pos.z + plank_h / 2))
        mid = (top + bottom) / 2
        rope_len = (top - bottom).length
        bpy.ops.mesh.primitive_cylinder_add(radius=0.004, depth=rope_len, location=mid)
        rope = bpy.context.active_object
        rope.rotation_euler = (0, 0, 0)
        rope.data.materials.append(rope_mat)

    def make_face(label, normal_sign):
        bpy.ops.object.text_add(location=(0, 0, 0))
        obj = bpy.context.active_object
        obj.data.body = label
        obj.data.align_x = 'CENTER'
        obj.data.align_y = 'CENTER'
        obj.data.size = 0.075
        obj.data.extrude = 0.0015
        obj.data.font = bpy.data.fonts.get('Bfont') or bpy.data.fonts[0]
        obj.data.materials.append(paint)
        if normal_sign > 0:
            local_x, local_y, local_z = (-1, 0, 0), (0, 0, 1), (0, 1, 0)
        else:
            local_x, local_y, local_z = (1, 0, 0), (0, 0, 1), (0, -1, 0)
        obj.matrix_world = face_matrix(
            mathutils.Vector(local_x), mathutils.Vector(local_y), mathutils.Vector(local_z)
        )
        obj.location = sign_pos + mathutils.Vector((0, normal_sign * (plank_t / 2 + 0.003), 0))
        paint.use_backface_culling = True
        return obj

    make_face('OPEN', 1)
    make_face('CLOSED', -1)


add_sign()

# ---------- cámara: baja por el tronco, de copa a raíz, rama a rama ----------
cam_data = bpy.data.cameras.new('DollyCam')
cam_data.lens = 50
cam = bpy.data.objects.new('DollyCam', cam_data)
bpy.context.collection.objects.link(cam)
bpy.context.scene.camera = cam

target = bpy.data.objects.new('CamTarget', None)
bpy.context.collection.objects.link(target)
track = cam.constraints.new('TRACK_TO')
track.target = target
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis = 'UP_Y'

cam_data.sensor_fit = 'VERTICAL'
cam_data.sensor_height = 36

# plano medio, no el árbol entero: así se ven las ramas de cerca al pasar
orbit_radius = max(radius_xy * 1.6, 1.4)
top_z = ground_z + height * 0.90      # arranca a la altura de la copa
bottom_z = ground_z + height * 0.14   # termina en el tronco bajo, sin comerse de suelo
orbit_span = math.radians(70)         # parallax lateral suave, sin vuelta completa

# ---------- render settings ----------
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'GPU'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for d in prefs.devices:
        d.use = (d.type == 'OPTIX')
    print('Cycles devices:', [(d.name, d.type, d.use) for d in prefs.devices])
except Exception as e:
    print('GPU prefs warning:', e)

scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = True
scene.render.use_persistent_data = True
scene.render.film_transparent = True
scene.render.resolution_x = RES
scene.render.resolution_y = RES
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'

indices = TEST_INDICES if TEST else list(range(N_FRAMES))
print(f'Renderizando {len(indices)} fotogramas -> {OUT_DIR}')

for i in indices:
    t = i / max(N_FRAMES - 1, 1)
    ease = t * t * (3 - 2 * t)  # smoothstep: entra/sale suave, como antes
    z = top_z + (bottom_z - top_z) * ease
    angle = -orbit_span / 2 + orbit_span * ease
    cam.location = (
        center.x + math.sin(angle) * orbit_radius,
        center.y - math.cos(angle) * orbit_radius,
        z,
    )
    target.location = (center.x, center.y, z - height * 0.02)
    scene.render.filepath = os.path.join(OUT_DIR, f'frame_{i:04d}.png')
    bpy.ops.render.render(write_still=True)
    print(f'[{i+1}/{len(indices)}] {scene.render.filepath}')

print('Hecho.')
