ssh-add $HOME/.ssh/id_ed25519
rm -rf dist/
git pull origin big-refactor &&\
	yarn install &&\
	./build.sh &&\
	./relm-deploy-only.sh