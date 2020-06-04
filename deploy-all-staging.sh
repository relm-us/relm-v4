ssh-add $HOME/.ssh/id_ed25519
rm -rf dist/
yarn install &&\
	./build.sh &&\
	./deploy-only-staging.sh