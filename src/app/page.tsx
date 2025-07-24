'use client';

import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { 
  FolderOpen, 
  Save, 
  Upload, 
  Eye,
  Download
} from 'lucide-react';
import * as THREE from 'three';

// File Manager Component
const FileManager = () => {
  const [activeTab, setActiveTab] = useState('files');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Files uploaded:', files);
      // Handle file upload logic here
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
          onClick={() => setActiveTab('files')}
          className={`px-4 py-2 text-sm border-r border-gray-600 ${
            activeTab === 'files' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Files
        </button>
        <button 
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2 text-sm border-r border-gray-600 ${
            activeTab === 'photos' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Photos
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
        <button className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 rounded flex items-center transition-colors">
          <FolderOpen className="w-4 h-4 mr-2" />
          Open Project
        </button>
        <button className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 rounded flex items-center transition-colors">
          <Save className="w-4 h-4 mr-2" />
          Save Project
        </button>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full p-3 text-left bg-gray-700 hover:bg-gray-600 rounded flex items-center transition-colors"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import Model
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".obj,.stl,.gltf,.glb,.fbx,.ply"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Recent Files */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Recent Files</h3>
        <div className="text-sm text-gray-500">
          No recent files
        </div>
      </div>

      {/* Scene Info */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Scene</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <div>Objects: 1</div>
          <div>Vertices: 8</div>
          <div>Faces: 6</div>
        </div>
      </div>
    </div>
  );
};

// 3D Scene Component
const Scene3D = () => {
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

      {/* Default 3D Object - Blue Cube */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial 
          color="#3b82f6" 
          metalness={0.1} 
          roughness={0.3} 
        />
      </mesh>

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
        <FileManager />

        {/* Main 3D Viewer */}
        <div className="flex-1 relative bg-gray-900">
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
            <Scene3D />
          </Canvas>

          {/* Viewport Info Overlay */}
          <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-80 rounded px-3 py-2 text-xs text-gray-300">
            Perspective View
          </div>

          {/* Performance Info */}
          <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-80 rounded px-3 py-2 text-xs text-gray-300">
            Viewer Only Mode
          </div>
        </div>
      </div>
    </div>
  );
}
