"""
Headless Blender export script.
Run: blender --background /path/to/Boot1.blend --python export_gltf.py -- "output.gltf"
"""
import sys
import bpy
import bmesh

def get_output_path():
    if "--" not in sys.argv:
        raise ValueError("No output path given.")
    argv = sys.argv[sys.argv.index("--") + 1:]
    if not argv:
        raise ValueError("Pass an output path after '--'.")
    return argv[0]

def prep_and_export(output_path):
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not mesh_objects:
        raise RuntimeError("No mesh objects found.")

    # Flush any pending edit-mode data
    for obj in mesh_objects:
        if obj.mode == 'EDIT':
            print(f"\"{obj.name}\" was left in Edit Mode – flushing")
            obj.update_from_editmode()

    # --- Ensure all mesh objects are in the master collection (so they appear in the view layer) ---
    master_collection = bpy.context.scene.collection
    for obj in mesh_objects:
        if obj.name not in master_collection.objects:
            master_collection.objects.link(obj)

    # --- Deselect everything in the view layer, then select our mesh objects ---
    view_layer = bpy.context.view_layer
    for obj in view_layer.objects:
        obj.select_set(False)

    for obj in mesh_objects:
        obj.select_set(True)

    view_layer.objects.active = mesh_objects[0]

    # --- Apply transforms (bakes into mesh data) ---
    for obj in mesh_objects:
        obj.data.transform(obj.matrix_basis)
        obj.matrix_basis.identity()

    # --- Recalculate normals + triangulate using bmesh ---
    for obj in mesh_objects:
        mesh = obj.data
        bm = bmesh.new()
        bm.from_mesh(mesh)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bmesh.ops.triangulate(bm, faces=bm.faces)
        bm.to_mesh(mesh)
        bm.free()
        mesh.update()
        print(f"Prepped mesh: {obj.name}")

    # --- Export to glTF ---
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLTF_SEPARATE',
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_normals=True,
        export_tangents=False,
        export_draco_mesh_compression_enable=True,
    )
    print(f"Exported to: {output_path}")

if __name__ == "__main__":
    prep_and_export(get_output_path())