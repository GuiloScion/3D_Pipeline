#!/bin/bash

# Meshroom Photogrammetry Setup Script
# Run this on your server to install Meshroom and dependencies

echo "🚀 Setting up Meshroom for photogrammetry processing..."

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo "❌ This script is designed for Linux servers"
    echo "For local development, install Meshroom manually from:"
    echo "https://alicevision.org/#meshroom"
    exit 1
fi

# Update system
sudo apt-get update -y

# Install required dependencies
echo "📦 Installing system dependencies..."
sudo apt-get install -y \
    build-essential \
    cmake \
    git \
    python3 \
    python3-pip \
    libopenexr-dev \
    libtiff5-dev \
    libpng-dev \
    libjpeg-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libavutil-dev \
    libboost-all-dev \
    libeigen3-dev \
    libceres-dev \
    libgoogle-glog-dev \
    libgflags-dev \
    libatlas-base-dev \
    libsuitesparse-dev

# Install Node.js dependencies for GLB conversion
echo "📦 Installing obj2gltf for model conversion..."
npm install -g obj2gltf

# Download and setup Meshroom
echo "📥 Downloading Meshroom..."
cd /opt
sudo wget https://github.com/alicevision/Meshroom/releases/download/v2023.3.0/Meshroom-2023.3.0-linux.tar.gz

# Extract Meshroom
echo "📂 Extracting Meshroom..."
sudo tar -xzf Meshroom-2023.3.0-linux.tar.gz
sudo mv Meshroom-2023.3.0 meshroom
sudo chmod +x meshroom/meshroom_compute

# Add Meshroom to PATH
echo "🔗 Adding Meshroom to system PATH..."
echo 'export PATH="/opt/meshroom:$PATH"' | sudo tee -a /etc/environment
export PATH="/opt/meshroom:$PATH"

# Create symlink for easier access
sudo ln -sf /opt/meshroom/meshroom_compute /usr/local/bin/meshroom_compute

# Set up temp directory
echo "📁 Creating temp directory for processing..."
sudo mkdir -p /app/temp
sudo chown -R $USER:$USER /app/temp

# Install additional Python packages
echo "🐍 Installing Python packages..."
pip3 install --user \
    opencv-python \
    numpy \
    pillow \
    scipy

# Test installation
echo "🧪 Testing Meshroom installation..."
if command -v meshroom_compute &> /dev/null; then
    echo "✅ Meshroom installed successfully!"
    meshroom_compute --help
else
    echo "❌ Meshroom installation failed"
    exit 1
fi

# Create processing script
echo "📝 Creating processing helper script..."
cat > /usr/local/bin/process_photos.sh << 'EOF'
#!/bin/bash

# Helper script for Meshroom processing
PHOTOS_DIR=$1
OUTPUT_DIR=$2

if [ -z "$PHOTOS_DIR" ] || [ -z "$OUTPUT_DIR" ]; then
    echo "Usage: process_photos.sh <photos_directory> <output_directory>"
    exit 1
fi

echo "Processing photos from: $PHOTOS_DIR"
echo "Output directory: $OUTPUT_DIR"

# Create Meshroom pipeline config
cat > /tmp/pipeline.mg << EOL
{
  "header": {
    "pipelineVersion": "2.2",
    "releaseVersion": "2023.3.0",
    "fileVersion": "1.1",
    "template": false
  },
  "graph": {
    "CameraInit_1": {
      "nodeType": "CameraInit",
      "position": [0, 0],
      "parallelization": {
        "blockSize": 0,
        "size": 1,
        "split": 1
      },
      "uids": {
        "0": "$(ls $PHOTOS_DIR/*.jpg | head -1)"
      },
      "internalFolder": "{cache}/{nodeType}_{uid0}/",
      "inputs": {
        "viewpoints": "$(find $PHOTOS_DIR -name '*.jpg' -o -name '*.jpeg' -o -name '*.png' | sort)",
        "intrinsics": [],
        "sensorDatabase": "${ALICEVISION_SENSOR_DB}",
        "defaultFieldOfView": 45.0,
        "groupCameraFallback": "folder",
        "allowedCameraModels": ["pinhole", "radial1", "radial3", "brown", "fisheye4", "fisheye1"],
        "useInternalWhiteBalance": true,
        "viewIdMethod": "metadata",
        "viewIdRegex": ".*?(\\d+)"
      },
      "outputs": {
        "output": "{cache}/CameraInit_1/"
      }
    }
  }
}
EOL

# Run Meshroom
meshroom_compute /tmp/pipeline.mg --output "$OUTPUT_DIR"
EOF

sudo chmod +x /usr/local/bin/process_photos.sh

echo ""
echo "🎉 Meshroom setup complete!"
echo ""
echo "Next steps:"
echo "1. Restart your terminal or run: source /etc/environment"
echo "2. Test with: meshroom_compute --help"
echo "3. Deploy your Next.js app with the API endpoint"
echo ""
echo "💡 For production, consider:"
echo "- Setting up a dedicated processing server"
echo "- Using queue system for large jobs"
echo "- Implementing progress tracking"
echo "- Adding result caching"
