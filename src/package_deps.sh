#!/bin/bash -e
#
# Script to pre-package all the Python dependencies for QIS
# (with C extensions compiled for the local platform).
# Creates an empty virtualenv, installs all requirements, then creates a
# tarball.gz of the resulting lib (incorporating site-packages) directory.
#
# Usage: src/package_deps.sh <python2.6 | python2.7>
#
# Outputs: $DIST_DIR/QIS-libs.tar.gz
#

PYTHON_VER=$1
VENV=venv
DIST_DIR=$(pwd)/dist
BUILD_DIR=$(pwd)/build
WHEELS_DIR=$BUILD_DIR/wheels
CACHE_DIR=$BUILD_DIR/cache
QISMAGICK_DIR=$HOME/qis-build/qismagick

if [ "$PYTHON_VER" = "" ]; then
	echo "You must specify which python version to use, e.g. package_deps.sh python2.7"
	exit 1
fi

if ! [ -x "$(command -v $PYTHON_VER)" ]; then
	echo "$PYTHON_VER does not seem to be installed"
	exit 1
fi

echo -e '\nCleaning build environment'
rm -rf $BUILD_DIR

echo -e '\nCreating new build environment'
mkdir $BUILD_DIR
mkdir $WHEELS_DIR
mkdir $CACHE_DIR
cd $BUILD_DIR
if [ "$PYTHON_VER" = "python2.6" ]; then
    virtualenv --python=$PYTHON_VER --no-pip $VENV
    . $VENV/bin/activate
    curl https://bootstrap.pypa.io/2.6/get-pip.py -o get-pip.py
    python get-pip.py
    rm get-pip.py
else
    virtualenv --python=$PYTHON_VER $VENV
    . $VENV/bin/activate
fi
cd ..

# Upgrade or downgrade setuptools for known bugs or issues
echo -e '\nUpgrading pip and setuptools'
if [ "$PYTHON_VER" = "python2.6" ]; then
    pip install -U "pip<10"
    pip install -U "setuptools<37"
    pip install -U "wheel<0.30"
else
    pip install setuptools
    pip install wheel
fi

# Download and cache the sdists for everything
echo -e '\nDownloading requirements'
pip download --dest $CACHE_DIR -r doc/requirements.txt

# Extract the sdists and build them into (bdist_wheel) wheels
echo -e '\nBuilding wheels of the requirements'
cd $CACHE_DIR
cp *.whl $WHEELS_DIR
find . -type f -name '*.zip' -exec unzip -o {} \;
find . -type f -name '*.tar.gz' -exec tar -zxf {} \;
find . -type f -name '*.tar.bz2' -exec tar -jxf {} \;
find . -type f -name 'setup.py' -execdir python -c "import setuptools; execfile('setup.py', {'__file__': './setup.py', '__name__': '__main__'})" bdist_wheel --dist-dir $WHEELS_DIR \;
cd ../..

# Add in the qismagick wheel, if present
echo -e '\nAdding qismagick.so wheel'
[ -d $QISMAGICK_DIR ] && cp $QISMAGICK_DIR/*.whl $WHEELS_DIR
[ -d $QISMAGICK_DIR ] || echo "WARNING! $QISMAGICK_DIR not found (you will need to add it later)"

# Install all the wheels we made (into the virtualenv's lib directory)
echo -e '\nInstalling all wheels into the build environment'
find $WHEELS_DIR -type f -name '*.whl' -exec wheel install --force {} \;

# Remove the pyc and pyo files
cd $BUILD_DIR
rm `find $VENV -name '*.py[co]'`
cd ..

# Package the virtualenv's lib directory for distribution
echo -e '\nTarballing the virtualenv lib folder'
[ -d $DIST_DIR ] || mkdir $DIST_DIR
cd $BUILD_DIR
tar -C $VENV -czf $DIST_DIR/QIS-libs.tar.gz lib
