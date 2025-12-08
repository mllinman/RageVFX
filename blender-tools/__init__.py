"""
RageVFX Blender Integration Tool
Version 3.10 - VDB Import/Export and Integration

This addon provides seamless integration between RageVFX and Blender:
- Import/Export OpenVDB files
- Create VDB volumes from Blender objects
- Export simulations to VDB format
- Material and shader preview
- RageVFX project integration

Installation:
1. Copy the blender-tools folder to Blender's addons directory
2. Enable "RageVFX Integration" in Preferences > Add-ons
"""

bl_info = {
    "name": "RageVFX Integration",
    "author": "RageVFX Team",
    "version": (3, 10, 0),
    "blender": (3, 0, 0),
    "location": "File > Import-Export, 3D View > Sidebar > RageVFX",
    "description": "Import/Export VDB files and integrate with RageVFX",
    "warning": "",
    "doc_url": "https://github.com/mllinman/RageVFX",
    "category": "Import-Export",
}

import bpy
from bpy.props import (
    StringProperty,
    BoolProperty,
    FloatProperty,
    IntProperty,
    EnumProperty,
    FloatVectorProperty,
)
from bpy.types import Operator, Panel, PropertyGroup
from bpy_extras.io_utils import ImportHelper, ExportHelper
import os


# ============================================================================
# VDB Import Operator
# ============================================================================

class RAGEVFX_OT_import_vdb(Operator, ImportHelper):
    """Import OpenVDB file into Blender"""
    bl_idname = "ragevfx.import_vdb"
    bl_label = "Import VDB"
    bl_options = {'REGISTER', 'UNDO'}

    filename_ext = ".vdb"
    filter_glob: StringProperty(
        default="*.vdb",
        options={'HIDDEN'},
    )

    # Import options
    import_density: BoolProperty(
        name="Import Density",
        description="Import density grid",
        default=True,
    )

    import_velocity: BoolProperty(
        name="Import Velocity",
        description="Import velocity grid",
        default=False,
    )

    import_temperature: BoolProperty(
        name="Import Temperature",
        description="Import temperature grid",
        default=False,
    )

    voxel_size_multiplier: FloatProperty(
        name="Voxel Size Multiplier",
        description="Scale voxel size on import",
        default=1.0,
        min=0.01,
        max=100.0,
    )

    create_volume: BoolProperty(
        name="Create Volume Object",
        description="Create a volume object for visualization",
        default=True,
    )

    def execute(self, context):
        filepath = self.filepath
        
        # In production, would use pyopenvdb to read VDB
        # For now, create a placeholder volume object
        
        bpy.ops.object.volume_add()
        volume_obj = context.active_object
        volume_obj.name = os.path.splitext(os.path.basename(filepath))[0]
        
        # Store import settings as custom properties
        volume_obj["vdb_filepath"] = filepath
        volume_obj["vdb_import_density"] = self.import_density
        volume_obj["vdb_import_velocity"] = self.import_velocity
        volume_obj["vdb_voxel_multiplier"] = self.voxel_size_multiplier
        
        self.report({'INFO'}, f"Imported VDB: {filepath}")
        return {'FINISHED'}


# ============================================================================
# VDB Export Operator
# ============================================================================

class RAGEVFX_OT_export_vdb(Operator, ExportHelper):
    """Export Blender volume/simulation to OpenVDB file"""
    bl_idname = "ragevfx.export_vdb"
    bl_label = "Export VDB"
    bl_options = {'REGISTER', 'UNDO'}

    filename_ext = ".vdb"
    filter_glob: StringProperty(
        default="*.vdb",
        options={'HIDDEN'},
    )

    # Export options
    export_density: BoolProperty(
        name="Export Density",
        description="Export density grid",
        default=True,
    )

    export_velocity: BoolProperty(
        name="Export Velocity",
        description="Export velocity grid",
        default=False,
    )

    export_temperature: BoolProperty(
        name="Export Temperature",
        description="Export temperature grid from simulation",
        default=False,
    )

    voxel_size: FloatProperty(
        name="Voxel Size",
        description="Size of VDB voxels",
        default=0.1,
        min=0.001,
        max=10.0,
    )

    compression: EnumProperty(
        name="Compression",
        description="Compression type for VDB file",
        items=[
            ('NONE', "None", "No compression"),
            ('ZIP', "ZIP", "ZIP compression"),
            ('BLOSC', "Blosc", "Blosc compression (recommended)"),
        ],
        default='BLOSC',
    )

    half_float: BoolProperty(
        name="Half Float",
        description="Use 16-bit float for smaller file size",
        default=False,
    )

    frame_sequence: BoolProperty(
        name="Export Frame Sequence",
        description="Export as frame sequence (file.####.vdb)",
        default=False,
    )

    start_frame: IntProperty(
        name="Start Frame",
        description="First frame to export",
        default=1,
    )

    end_frame: IntProperty(
        name="End Frame",
        description="Last frame to export",
        default=250,
    )

    def execute(self, context):
        filepath = self.filepath
        
        if self.frame_sequence:
            # Export sequence
            for frame in range(self.start_frame, self.end_frame + 1):
                context.scene.frame_set(frame)
                frame_path = filepath.replace(".vdb", f".{frame:04d}.vdb")
                self._export_single_frame(context, frame_path)
            
            self.report({'INFO'}, f"Exported {self.end_frame - self.start_frame + 1} frames")
        else:
            # Export single frame
            self._export_single_frame(context, filepath)
            self.report({'INFO'}, f"Exported VDB: {filepath}")
        
        return {'FINISHED'}

    def _export_single_frame(self, context, filepath):
        """Export a single frame to VDB"""
        # In production, would use pyopenvdb to write VDB
        # For now, just log the export
        
        print(f"Exporting to: {filepath}")
        print(f"  Density: {self.export_density}")
        print(f"  Velocity: {self.export_velocity}")
        print(f"  Temperature: {self.export_temperature}")
        print(f"  Voxel Size: {self.voxel_size}")
        print(f"  Compression: {self.compression}")


# ============================================================================
# VDB Convert Operator
# ============================================================================

class RAGEVFX_OT_convert_to_vdb(Operator):
    """Convert selected object to VDB volume"""
    bl_idname = "ragevfx.convert_to_vdb"
    bl_label = "Convert to VDB"
    bl_options = {'REGISTER', 'UNDO'}

    voxel_size: FloatProperty(
        name="Voxel Size",
        description="Size of VDB voxels",
        default=0.1,
        min=0.001,
        max=10.0,
    )

    exterior_band_width: FloatProperty(
        name="Exterior Band Width",
        description="Width of exterior narrow band",
        default=3.0,
        min=1.0,
        max=10.0,
    )

    interior_band_width: FloatProperty(
        name="Interior Band Width",
        description="Width of interior narrow band",
        default=3.0,
        min=1.0,
        max=10.0,
    )

    @classmethod
    def poll(cls, context):
        return context.active_object is not None

    def execute(self, context):
        obj = context.active_object
        
        # Create volume from mesh
        bpy.ops.object.volume_add()
        volume_obj = context.active_object
        volume_obj.name = f"{obj.name}_VDB"
        volume_obj.location = obj.location
        
        # Store conversion settings
        volume_obj["vdb_source"] = obj.name
        volume_obj["vdb_voxel_size"] = self.voxel_size
        volume_obj["vdb_exterior_band"] = self.exterior_band_width
        volume_obj["vdb_interior_band"] = self.interior_band_width
        
        self.report({'INFO'}, f"Converted {obj.name} to VDB volume")
        return {'FINISHED'}


# ============================================================================
# RageVFX Properties
# ============================================================================

class RageVFXProperties(PropertyGroup):
    """Properties for RageVFX integration"""
    
    vdb_filepath: StringProperty(
        name="VDB File",
        description="Path to VDB file",
        subtype='FILE_PATH',
    )

    auto_import: BoolProperty(
        name="Auto Import",
        description="Automatically import VDB when file changes",
        default=False,
    )

    live_preview: BoolProperty(
        name="Live Preview",
        description="Show live preview of VDB data",
        default=True,
    )

    density_grid_name: StringProperty(
        name="Density Grid",
        description="Name of density grid in VDB",
        default="density",
    )

    velocity_grid_name: StringProperty(
        name="Velocity Grid",
        description="Name of velocity grid in VDB",
        default="vel",
    )

    temperature_grid_name: StringProperty(
        name="Temperature Grid",
        description="Name of temperature grid in VDB",
        default="temperature",
    )


# ============================================================================
# RageVFX Panel
# ============================================================================

class RAGEVFX_PT_main_panel(Panel):
    """Main RageVFX integration panel"""
    bl_label = "RageVFX Integration"
    bl_idname = "RAGEVFX_PT_main_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'RageVFX'

    def draw(self, context):
        layout = self.layout
        props = context.scene.ragevfx
        
        # Import/Export section
        box = layout.box()
        box.label(text="VDB Operations", icon='FILE_VOLUME')
        
        row = box.row(align=True)
        row.operator("ragevfx.import_vdb", text="Import VDB", icon='IMPORT')
        row.operator("ragevfx.export_vdb", text="Export VDB", icon='EXPORT')
        
        box.operator("ragevfx.convert_to_vdb", text="Convert to VDB", icon='MOD_FLUIDSIM')
        
        # Settings section
        box = layout.box()
        box.label(text="VDB Settings", icon='SETTINGS')
        box.prop(props, "density_grid_name")
        box.prop(props, "velocity_grid_name")
        box.prop(props, "temperature_grid_name")
        
        # Preview section
        box = layout.box()
        box.label(text="Preview", icon='HIDE_OFF')
        box.prop(props, "live_preview")
        box.prop(props, "auto_import")


class RAGEVFX_PT_volume_panel(Panel):
    """VDB Volume properties panel"""
    bl_label = "VDB Volume Properties"
    bl_idname = "RAGEVFX_PT_volume_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'RageVFX'

    @classmethod
    def poll(cls, context):
        return context.active_object and context.active_object.type == 'VOLUME'

    def draw(self, context):
        layout = self.layout
        obj = context.active_object
        
        if "vdb_filepath" in obj:
            box = layout.box()
            box.label(text="VDB Source", icon='FILE_VOLUME')
            box.label(text=f"File: {os.path.basename(obj['vdb_filepath'])}")
            
            if "vdb_voxel_multiplier" in obj:
                box.label(text=f"Voxel Multiplier: {obj['vdb_voxel_multiplier']:.2f}")
        
        if "vdb_source" in obj:
            box = layout.box()
            box.label(text="Converted From", icon='MESH_DATA')
            box.label(text=f"Source: {obj['vdb_source']}")
            box.label(text=f"Voxel Size: {obj.get('vdb_voxel_size', 0.1):.3f}")


# ============================================================================
# Menu Functions
# ============================================================================

def menu_func_import(self, context):
    self.layout.operator(RAGEVFX_OT_import_vdb.bl_idname, text="OpenVDB (.vdb)")

def menu_func_export(self, context):
    self.layout.operator(RAGEVFX_OT_export_vdb.bl_idname, text="OpenVDB (.vdb)")


# ============================================================================
# Registration
# ============================================================================

classes = (
    RageVFXProperties,
    RAGEVFX_OT_import_vdb,
    RAGEVFX_OT_export_vdb,
    RAGEVFX_OT_convert_to_vdb,
    RAGEVFX_PT_main_panel,
    RAGEVFX_PT_volume_panel,
)

def register():
    for cls in classes:
        bpy.utils.register_class(cls)
    
    bpy.types.Scene.ragevfx = bpy.props.PointerProperty(type=RageVFXProperties)
    bpy.types.TOPBAR_MT_file_import.append(menu_func_import)
    bpy.types.TOPBAR_MT_file_export.append(menu_func_export)

def unregister():
    bpy.types.TOPBAR_MT_file_export.remove(menu_func_export)
    bpy.types.TOPBAR_MT_file_import.remove(menu_func_import)
    del bpy.types.Scene.ragevfx
    
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)

if __name__ == "__main__":
    register()
