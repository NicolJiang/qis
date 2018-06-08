PYTHON_BIN := $(shell which python3 || which python3.6 || which python3.5 || which python3.4)
PYTHON_VER := $(shell ${PYTHON_BIN} -c 'import platform; print(platform.python_version()[:3])')
PYTHON := python${PYTHON_VER}
VENV_PATH := .
VENV_ACTIVATE := . ${VENV_PATH}/bin/activate
SET_LOCALE := export LANG=en_GB.UTF-8 ; export LC_ALL=en_GB.UTF-8

jenkins: test distribute

distribute: venv webpack
	src/package_deps.sh ${PYTHON}
	${VENV_ACTIVATE} ; python setup.py sdist
	echo 'The packaged application and libraries are now in the "dist" folder'

test:
	make flake8.txt
	make runtests

runtests: venv testing_env
	${VENV_ACTIVATE} ; ${SET_LOCALE} ; coverage run --source src/imageserver setup.py test
	coverage xml -o src/coverage.xml

runserver: venv
	${VENV_ACTIVATE} ; ${SET_LOCALE} ; python src/runserver.py

webpack:
	src/compress_js.sh

venv: ${VENV_PATH}/bin/activate setup.py doc/requirements.txt
	${VENV_ACTIVATE} ; pip install --upgrade pip setuptools wheel
	${VENV_ACTIVATE} ; pip install --upgrade -r doc/requirements.txt

testing_env: ${VENV_PATH}/bin/flake8 ${VENV_PATH}/bin/coverage

flake8.txt: testing_env
	${VENV_ACTIVATE} ; flake8 src/ > src/flake8.txt || wc -l src/flake8.txt

${VENV_PATH}/bin/flake8: ${VENV_PATH}/bin/activate
	${VENV_ACTIVATE} ; pip install flake8

${VENV_PATH}/bin/coverage: ${VENV_PATH}/bin/activate
	${VENV_ACTIVATE} ; pip install coverage

${VENV_PATH}/bin/activate:
	virtualenv --python=${PYTHON} ${VENV_PATH}

.PHONY: distribute jenkins test runtests runserver webpack flake8.txt venv testing_env
