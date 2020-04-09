ssh-add $HOME/.ssh/id_ed25519
rm -rf dist/
git pull origin master &&\
	yarn install &&\
	./build.sh &&\
	./deploy-only.sh