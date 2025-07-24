import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

// Meshroom photogrammetry processing endpoint
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];
    
    if (files.length < 3) {
      return NextResponse.json({ 
        error: 'At least 3 photos required for photogrammetry' 
      }, { status: 400 });
    }

    console.log(`Starting photogrammetry with ${files.length} photos`);

    // Generate unique session ID
    const sessionId = uuidv4();
    const workDir = path.join(process.cwd(), 'temp', sessionId);
    const photosDir = path.join(workDir, 'photos');
    const outputDir = path.join(workDir, 'output');

    // Create directories
    await fs.promises.mkdir(photosDir, { recursive: true });
    await fs.promises.mkdir(outputDir, { recursive: true });

    // Save uploaded photos
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `photo_${i.toString().padStart(3, '0')}.jpg`;
      await fs.promises.writeFile(path.join(photosDir, filename), buffer);
    }

    console.log(`Photos saved to ${photosDir}`);

    // Create Meshroom pipeline configuration
    const meshroomConfig = {
      graph: {
        CameraInit: {
          inputs: {
            viewpoints: files.map((_, i) => ({
              path: path.join(photosDir, `photo_${i.toString().padStart(3, '0')}.jpg`),
              intrinsic: "unknown"
            }))
          }
        },
        FeatureExtraction: {
          inputs: {
            input: "{CameraInit.output}"
          }
        },
        ImageMatching: {
          inputs: {
            input: "{FeatureExtraction.input}",
            features: "{FeatureExtraction.output}"
          }
        },
        FeatureMatching: {
          inputs: {
            input: "{ImageMatching.input}",
            features: "{FeatureExtraction.output}",
            matches: "{ImageMatching.output}"
          }
        },
        StructureFromMotion: {
          inputs: {
            input: "{FeatureMatching.input}",
            features: "{FeatureExtraction.output}",
            matches: "{FeatureMatching.output}"
          }
        },
        PrepareDenseScene: {
          inputs: {
            input: "{StructureFromMotion.output}"
          }
        },
        DepthMap: {
          inputs: {
            input: "{PrepareDenseScene.input}",
            imagesFolder: "{PrepareDenseScene.output}"
          }
        },
        DepthMapFilter: {
          inputs: {
            input: "{DepthMap.input}",
            depthMapsFolder: "{DepthMap.output}"
          }
        },
        Meshing: {
          inputs: {
            input: "{DepthMapFilter.input}",
            depthMapsFolder: "{DepthMapFilter.depthMapsFolder}",
            depthMapsFilterFolder: "{DepthMapFilter.output}"
          }
        },
        MeshFiltering: {
          inputs: {
            inputMesh: "{Meshing.output}"
          }
        },
        Texturing: {
          inputs: {
            input: "{MeshFiltering.input}",
            inputMesh: "{MeshFiltering.outputMesh}"
          }
        }
      }
    };

    // Save Meshroom config
    const configPath = path.join(workDir, 'pipeline.mg');
    await fs.promises.writeFile(configPath, JSON.stringify(meshroomConfig, null, 2));

    console.log('Starting Meshroom processing...');

    // Execute Meshroom pipeline
    const meshroomCmd = `meshroom_compute ${configPath} --output ${outputDir}`;
    
    try {
      const { stdout, stderr } = await execAsync(meshroomCmd, {
        timeout: 300000, // 5 minutes timeout
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      console.log('Meshroom stdout:', stdout);
      if (stderr) console.log('Meshroom stderr:', stderr);

    } catch (execError: any) {
      console.error('Meshroom execution error:', execError);
      return NextResponse.json({ 
        error: 'Photogrammetry processing failed',
        details: execError.message
      }, { status: 500 });
    }

    // Check for output files
    const meshPath = path.join(outputDir, 'Texturing', 'texturedMesh.obj');
    const texturePath = path.join(outputDir, 'Texturing', 'texture_1001.jpg');

    if (!fs.existsSync(meshPath)) {
      return NextResponse.json({ 
        error: 'No mesh generated - check photo quality and overlap' 
      }, { status: 500 });
    }

    // Convert to GLB for web viewing
    const glbPath = path.join(outputDir, 'model.glb');
    const convertCmd = `obj2gltf -i ${meshPath} -o ${glbPath}`;
    
    try {
      await execAsync(convertCmd);
    } catch (convertError) {
      console.error('GLB conversion error:', convertError);
      // Continue with OBJ if GLB conversion fails
    }

    // Read the generated files
    const meshData = await fs.promises.readFile(meshPath);
    let textureData = null;
    let glbData = null;

    if (fs.existsSync(texturePath)) {
      textureData = await fs.promises.readFile(texturePath);
    }

    if (fs.existsSync(glbPath)) {
      glbData = await fs.promises.readFile(glbPath);
    }

    // Clean up temp files (optional - you might want to keep them for debugging)
    // await fs.promises.rm(workDir, { recursive: true, force: true });

    console.log('Photogrammetry completed successfully');

    return NextResponse.json({
      success: true,
      sessionId,
      files: {
        mesh: meshData.toString('base64'),
        texture: textureData ? textureData.toString('base64') : null,
        glb: glbData ? glbData.toString('base64') : null
      },
      stats: {
        photosProcessed: files.length,
        meshVertices: 'unknown', // Would need to parse OBJ to get this
        processingTime: 'calculated'
      }
    });

  } catch (error: any) {
    console.error('Photogrammetry API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
