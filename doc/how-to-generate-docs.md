# How to generate docs locally

Assume that we want to upgrade python from version 3.6 to 3.8.
```
sudo apt update -y
sudo apt install python3.8
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.6 1
sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.8 2
sudo update-alternatives --config python3
sudo rm /usr/bin/python3
sudo ln -s python3.8 /usr/bin/python3
sudo apt install python3.8-venv
python3 -m venv doc_env
source doc_env/bin/activate
pip install -r doc/requirements.txt
yarn gulp docs
```

Do not commit generated directories such as `doc_env`.