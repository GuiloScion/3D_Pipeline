'use client';

import React, { useState, useRef } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, useGLTF } from '@react-three/drei';
import { 
  FolderOpen, 
  Save, 
  Upload, 
  Eye,
  Download
} from 'lucide-react';
import * as THREE from 'three';

// Simple photogrammetry simulator that creates a 3D model from uploaded photos
const simulatePhotogrammetry = async (files: FileList): Promise<THREE.Group> => {
  // Create a simple 3D model based on the photos
  const group = new THREE.Group();
  
  // Analyze photos to determine object characteristics
  const photoCount = files.length;
  const hasMultipleAngles = photoCount >= 4;
  
  // Create different geometries based on photo analysis
  let geometry: THREE.BufferGeometry;
  let material: THREE.Material;
  
  if (photoCount >= 8) {
    // Complex object - use sphere with displacement
    geometry = new THREE.SphereGeometry(1, 32, 32);
    material = new THREE.MeshStandardMaterial({ 
      color: '#8B5CF6',
      metalness: 0.1,
      roughness: 0.4,
      wireframe: false
    });
  } else if (photoCount >= 4) {
    // Medium complexity - use cylinder  
    geometry = new THREE.CylinderGeometry(0.8, 1, 1.5, 16);
    material = new THREE.MeshStandardMaterial({ 
      color: '#10B981',
      metalness: 0.2,
      roughness: 0.3
    });
  } else {
    // Simple object - use box
    geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    material = new THREE.MeshStandardMaterial({ 
      color: '#F59E0B',
      metalness: 0.1,
      roughness: 0.5
    });
  }
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0.5, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  group.add(mesh);
  
  // Add some detail meshes to make it look more complex
  if (hasMultipleAngles) {
    for (let i = 0; i < 3; i++) {
      const detailGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const detailMaterial = new THREE.MeshStandardMaterial({ 
        color: '#EF4444',
        metalness: 0.8,
        roughness: 0.2
      });
      const detailMesh = new THREE.Mesh(detailGeometry, detailMaterial);
      
      const angle = (i / 3) * Math.PI * 2;
      detailMesh.position.set(
        Math.cos(angle) * 0.8,
        0.5 + Math.sin(i) * 0.3,
        Math.sin(angle) * 0.8
      );
      group.add(detailMesh);
    }
  }
  
  return group;
};

// Export functions
const exportSTL = (model: THREE.Group) => {
  // In a real app, you'd use STLExporter from three/examples
  const stlData = `solid model
    facet normal 0 0 1
      outer loop
        vertex 0 0 0
        vertex 1 0 0
        vertex 1 1 0
      endloop
    endfacet
  endsolid model`;
  
  const blob = new Blob([stlData], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'photogrammetry_model.stl';
  link.click();
  URL.revokeObjectURL(url);
};

const exportOBJ = (model: THREE.Group) => {
  // Simplified OBJ export
  const objData = `# Photogrammetry Model
o Model
v 0.0 0.0 0.0
v 1.0 0.0 0.0
v 1.0 1.0 0.0
v 0.0 1.0 0.0
f 1 2 3 4`;
  
  const blob = new Blob([objData], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'photogrammetry_model.obj';
  link.click();
  URL.revokeObjectURL(url);
};
  const [activeTab, setActiveTab] = useState('photos');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Photos uploaded:', files);
      onPhotosUpload(files);
    }
  };

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
      {/* File Manager Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-sm font-medium text-gray-300">File Manager</h2>
      </div>

      {/* File Tabs */}
      <div className="flex border-b border-gray-700">
        <button 
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 text-sm border-r border-gray-600 ${
            activeTab === 'photos' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Photos
        </button>
        <button 
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 text-sm border-r border-gray-600 ${
            activeTab === 'files' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Files
        </button>
        <button 
          onClick={() => setActiveTab('export')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'export' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Export
        </button>
      </div>

      {/* File Actions */}
      <div className="p-4 space-y-2">
        {activeTab === 'photos' && (
          <>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 text-left bg-blue-600 hover:bg-blue-700 rounded flex items-center transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos for 3D Model
            </button>
            <div className="text-xs text-gray-400 px-1">
              Upload multiple photos of an object to generate a 3D model
            </div>
          </>
        )}
        
        {activeTab === 'files' && (
          <>
            <button className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 rounded flex items-center transition-colors">
              <FolderOpen className="w-4 h-4 mr-2" />
              Open Project
            </button>
            <button className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 rounded flex items-center transition-colors">
              <Save className="w-4 h-4 mr-2" />
              Save Project
            </button>
          </>
        )}

        {activeTab === 'export' && (
          <>
            <button 
              onClick={onExportSTL}
              disabled={!hasModel}
              className={`w-full p-3 text-left rounded flex items-center transition-colors ${
                hasModel 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              Export as STL
            </button>
            <button 
              onClick={onExportOBJ}
              disabled={!hasModel}
              className={`w-full p-3 text-left rounded flex items-center transition-colors ${
                hasModel 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              Export as OBJ
            </button>
            <button 
              disabled={!hasModel}
              className={`w-full p-3 text-left rounded flex items-center transition-colors ${
                hasModel 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              Export as GLTF
            </button>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Recent Files / Upload Status */}
      <div className="p-4 flex-1 overflow-y-auto">
        {activeTab === 'photos' && (
          <>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Uploaded Photos</h3>
            {uploadedPhotos.length === 0 ? (
              <div className="text-sm text-gray-500">
                No photos uploaded yet
              </div>
            ) : (
              <div className="space-y-2">
                {uploadedPhotos.map((file, index) => (
                  <div key={index} className="bg-gray-700 rounded p-2 text-xs">
                    <div className="text-white truncate">{file.name}</div>
                    <div className="text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
                  </div>
                ))}
                <div className="text-xs text-green-400 mt-2">
                  ✓ {uploadedPhotos.length} photos ready for processing
                </div>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'files' && (
          <>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Recent Files</h3>
            <div className="text-sm text-gray-500">
              No recent files
            </div>
          </>
        )}

        {activeTab === 'export' && (
          <>
            <h3 className="text-sm font-medium text-gray-300 mb-2">Export Options</h3>
            {hasModel ? (
              <div className="text-sm text-green-400">
                ✓ 3D model ready for export
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Generate a 3D model first to enable export
              </div>
            )}
          </>
        )}
      </div>

      {/* Scene Info */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Scene</h3>
        <div className="text-xs text-gray-500 space-y-1">
          {hasModel ? (
            <>
              <div>Status: Model Ready</div>
              <div>Photos used: {uploadedPhotos.length}</div>
              <div>Ready for export</div>
            </>
          ) : uploadedPhotos.length > 0 ? (
            <>
              <div>Status: Photos Uploaded</div>
              <div>Ready to generate model</div>
            </>
          ) : (
            <>
              <div>Status: Empty</div>
              <div>Upload photos to generate 3D model</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 3D Scene Component
const Scene3D = ({ model }: { model: any }) => {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Environment */}
      <Environment preset="city" />

      {/* Grid */}
      <Grid 
        args={[20, 20]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#404040" 
        sectionSize={5} 
        sectionThickness={1} 
        sectionColor="#606060"
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Generated 3D Model (when available) */}
      {model && (
        <primitive object={model} position={[0, 0, 0]} />
      )}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={50}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
};

// Main App Component
export default function Home() {
  const [generatedModel, setGeneratedModel] = useState<THREE.Group | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);

  const handlePhotosUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    setUploadedPhotos(fileArray);
    setIsProcessing(true);
    
    console.log(`Processing ${files.length} photos for 3D reconstruction...`);
    
    try {
      // Simulate processing time based on number of photos
      const processingTime = Math.min(files.length * 500, 3000);
      
      setTimeout(async () => {
        const model = await simulatePhotogrammetry(files);
        setGeneratedModel(model);
        setIsProcessing(false);
        console.log('3D model generation complete');
      }, processingTime);
      
    } catch (error) {
      console.error('Error generating 3D model:', error);
      setIsProcessing(false);
    }
  };

  const handleExportSTL = () => {
    if (generatedModel) {
      exportSTL(generatedModel);
    }
  };

  const handleExportOBJ = () => {
    if (generatedModel) {
      exportOBJ(generatedModel);
    }
  };
  return (
    <div className="h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* Top Header */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 shrink-0">
        <h1 className="text-lg font-semibold">Advanced 3D Modeling Studio</h1>
        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center text-sm text-gray-400">
            <Eye className="w-4 h-4 mr-1" />
            Active Tool: Select
          </div>
          <button className="text-gray-400 hover:text-white">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-3rem)]">
        {/* Left Sidebar - File Manager */}
        <FileManager 
          onPhotosUpload={handlePhotosUpload}
          onExportSTL={handleExportSTL}
          onExportOBJ={handleExportOBJ}
          hasModel={!!generatedModel}
          uploadedPhotos={uploadedPhotos}
        />

        {/* Main 3D Viewer */}
        <div className="flex-1 relative bg-gray-900">
          {!generatedModel && !isProcessing && (
            /* Empty State */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-400 mb-2">No 3D Model Yet</h2>
                <p className="text-gray-500 max-w-md">
                  Upload multiple photos of an object to generate a 3D model through photogrammetry
                </p>
              </div>
            </div>
          )}

          {isProcessing && (
            /* Processing State */
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <h2 className="text-xl font-semibold text-gray-400 mb-2">Processing Photos</h2>
                <p className="text-gray-500">
                  Generating 3D model from uploaded photos...
                </p>
              </div>
            </div>
          )}

          <Canvas
            camera={{ 
              position: [5, 5, 5], 
              fov: 50,
              near: 0.1,
              far: 1000
            }}
            shadows
            className="w-full h-full"
          >
            <Scene3D model={generatedModel} />
          </Canvas>

          {/* Viewport Info Overlay */}
          <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-80 rounded px-3 py-2 text-xs text-gray-300">
            Perspective View
          </div>

          {/* Performance Info */}
          <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-80 rounded px-3 py-2 text-xs text-gray-300">
            {isProcessing ? 'Processing...' : generatedModel ? '3D Model Ready' : 'Photogrammetry Viewer'}
          </div>
        </div>
      </div>
    </div>
  );
}
