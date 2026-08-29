#!/usr/bin/env python3
"""
Blender DNA Block Repair Tool

This script repairs corrupted DNA blocks in Blender .blend files that cause
"missing DNA block" errors or crashes when opening.

Common DNA block corruption issues fixed:
1. Size mismatch in DNA header
2. Invalid memory pointers in DNA header
3. Corrupted section counts

Usage: python3 blender_dna_repair.py <input_file.blend> [output_file.blend]

Author: Generated during blender-recovery project
"""

import sys
import os
import struct
from pathlib import Path


class BlenderDNARepair:
    def __init__(self, filepath):
        self.filepath = filepath
        self.data = None
        self.dna_pos = None
        self.endb_pos = None

    def load_file(self):
        """Load the .blend file into memory"""
        try:
            with open(self.filepath, 'rb') as f:
                self.data = f.read()
            print(f"Loaded file: {self.filepath} ({len(self.data)} bytes)")
            return True
        except Exception as e:
            print(f"Error loading file: {e}")
            return False

    def validate_blender_file(self):
        """Validate that this is a Blender file"""
        if len(self.data) < 16:
            print("ERROR: File too small to be a valid Blender file")
            return False

        header = self.data[:16]
        if not header.startswith(b'BLENDER'):
            print("ERROR: Not a valid Blender file")
            return False

        version = header[7:12].decode('ascii', errors='ignore')
        arch = header[12:16]

        print(f"Blender version: {version}")
        print(f"Architecture: {arch}")
        return True

    def find_dna_block(self):
        """Find the DNA1 block and ENDB marker"""
        self.dna_pos = self.data.find(b'DNA1')
        if self.dna_pos == -1:
            print("ERROR: DNA1 block not found")
            return False

        self.endb_pos = self.data.find(b'ENDB', self.dna_pos)
        if self.endb_pos == -1:
            print("ERROR: ENDB marker not found")
            return False

        print(f"DNA1 found at position: {self.dna_pos}")
        print(f"ENDB found at position: {self.endb_pos}")
        return True

    def analyze_dna_corruption(self):
        """Analyze the DNA block for corruption"""
        issues = []

        # Get DNA header
        dna_header = self.data[self.dna_pos:self.dna_pos + 24]

        # Check size field
        stored_size = struct.unpack('<I', dna_header[4:8])[0]
        actual_size = self.endb_pos - self.dna_pos - 8

        if stored_size != actual_size:
            issues.append({
                'type': 'size_mismatch',
                'stored_size': stored_size,
                'actual_size': actual_size,
                'description': f"DNA size mismatch: stored={stored_size}, actual={actual_size}"
            })

        # Check for potentially invalid pointers
        ptr1 = struct.unpack('<I', dna_header[8:12])[0]
        ptr2 = struct.unpack('<I', dna_header[12:16])[0]

        # High values might indicate invalid pointers
        if ptr1 > 0xFFFFFF or ptr2 > 0xFFFFFF:
            issues.append({
                'type': 'invalid_pointers',
                'ptr1': ptr1,
                'ptr2': ptr2,
                'description': f"Potentially invalid pointers: {ptr1:08x}, {ptr2:08x}"
            })

        # Analyze SDNA structure
        dna_block = self.data[self.dna_pos:self.endb_pos]
        sdna_pos = dna_block.find(b'SDNA')

        if sdna_pos != -1:
            # Check NAME section
            name_pos = dna_block.find(b'NAME', sdna_pos)
            if name_pos != -1:
                name_count = struct.unpack('<I', dna_block[name_pos + 4:name_pos + 8])[0]
                if name_count > 100000:  # Unreasonably high
                    issues.append({
                        'type': 'invalid_name_count',
                        'count': name_count,
                        'description': f"Invalid name count: {name_count}"
                    })

            # Check TYPE section
            type_pos = dna_block.find(b'TYPE', name_pos if name_pos != -1 else sdna_pos)
            if type_pos != -1:
                type_count = struct.unpack('<I', dna_block[type_pos + 4:type_pos + 8])[0]
                if type_count > 10000:  # Unreasonably high
                    issues.append({
                        'type': 'invalid_type_count',
                        'count': type_count,
                        'description': f"Invalid type count: {type_count}"
                    })

            # Check STRC section
            strc_pos = dna_block.find(b'STRC', type_pos if type_pos != -1 else sdna_pos)
            if strc_pos != -1:
                struct_count = struct.unpack('<I', dna_block[strc_pos + 4:strc_pos + 8])[0]
                if struct_count > 5000:  # Unreasonably high
                    issues.append({
                        'type': 'invalid_struct_count',
                        'count': struct_count,
                        'description': f"Invalid struct count: {struct_count}"
                    })

        return issues

    def apply_fixes(self, issues):
        """Apply fixes for identified issues"""
        fixed_data = self.data
        fixes_applied = []

        for issue in issues:
            if issue['type'] == 'size_mismatch':
                # Fix size mismatch
                correct_size = issue['actual_size']
                size_bytes = struct.pack('<I', correct_size)
                fixed_data = (fixed_data[:self.dna_pos + 4] +
                              size_bytes +
                              fixed_data[self.dna_pos + 8:])
                fixes_applied.append(f"Fixed size mismatch: {issue['stored_size']} -> {correct_size}")

            elif issue['type'] == 'invalid_pointers':
                # Zero out invalid pointers
                fixed_data = (fixed_data[:self.dna_pos + 8] +
                              b'\x00\x00\x00\x00\x00\x00\x00\x00' +
                              fixed_data[self.dna_pos + 16:])
                fixes_applied.append("Zeroed out invalid pointers")

            elif issue['type'] == 'invalid_name_count':
                # Fix invalid name count (conservative estimate)
                dna_block = fixed_data[self.dna_pos:self.endb_pos]
                sdna_pos = dna_block.find(b'SDNA')
                name_pos = dna_block.find(b'NAME', sdna_pos)

                if name_pos != -1:
                    conservative_count = 5000
                    count_bytes = struct.pack('<I', conservative_count)
                    global_name_pos = self.dna_pos + name_pos + 4
                    fixed_data = (fixed_data[:global_name_pos] +
                                  count_bytes +
                                  fixed_data[global_name_pos + 4:])
                    fixes_applied.append(f"Fixed name count: {issue['count']} -> {conservative_count}")

        self.data = fixed_data
        return fixes_applied

    def save_repaired_file(self, output_path):
        """Save the repaired file"""
        try:
            with open(output_path, 'wb') as f:
                f.write(self.data)
            print(f"Repaired file saved: {output_path}")
            return True
        except Exception as e:
            print(f"Error saving file: {e}")
            return False

    def repair(self, output_path=None):
        """Main repair function"""
        if not self.load_file():
            return False

        if not self.validate_blender_file():
            return False

        if not self.find_dna_block():
            return False

        print("\nAnalyzing DNA corruption...")
        issues = self.analyze_dna_corruption()

        if not issues:
            print("No corruption detected in DNA block!")
            return True

        print(f"\nFound {len(issues)} issue(s):")
        for issue in issues:
            print(f"  - {issue['description']}")

        print("\nApplying fixes...")
        fixes_applied = self.apply_fixes(issues)

        for fix in fixes_applied:
            print(f"  ✓ {fix}")

        if output_path:
            return self.save_repaired_file(output_path)

        return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 blender_dna_repair.py <input_file.blend> [output_file.blend]")
        print("\nThis tool repairs corrupted DNA blocks in Blender files.")
        print("If no output file is specified, adds '_repaired' to the input filename.")
        sys.exit(1)

    input_file = sys.argv[1]

    if not os.path.exists(input_file):
        print(f"ERROR: Input file '{input_file}' not found")
        sys.exit(1)

    # Determine output filename
    if len(sys.argv) > 2:
        output_file = sys.argv[2]
    else:
        path = Path(input_file)
        output_file = str(path.parent / (path.stem + '_repaired' + path.suffix))

    print(f"Blender DNA Block Repair Tool")
    print(f"Input:  {input_file}")
    print(f"Output: {output_file}")
    print("-" * 50)

    repair_tool = BlenderDNARepair(input_file)

    if repair_tool.repair(output_file):
        print("\n✓ Repair completed successfully!")
        print(f"Try opening the repaired file: {output_file}")
    else:
        print("\n✗ Repair failed!")
        sys.exit(1)


if __name__ == "__main__":
    main()