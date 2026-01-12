Sonar Qube Token

New token "sqp_a5f43b87e7a57d78b1c0828347536c01e6250ac8" has been created. Make sure you copy it now, you won't be able to see it again!


sonar runner command

docker run -d -v /tmp:/tmp -v /var/run/docker.sock:/var/run/docker.sock -v /var/lib/docker/containers:/var/lib/docker/containers:ro -e ACCOUNT_UUID={4c6feea6-ab14-40bd-a579-e26df4fc094f} -e REPOSITORY_UUID={aeb8517c-f606-4217-8e14-99ca9da5c775} -e RUNNER_UUID={e7b6a873-6180-579b-81e2-3aa7ed5ee6cd} -e RUNTIME_PREREQUISITES_ENABLED=true -e OAUTH_CLIENT_ID=F9FCAjrKr9UCm5uW3KZj93uNVG7zw8zR -e OAUTH_CLIENT_SECRET=ATOAUKkpjFcN-g_BNkVA8ML0M0tVLflG0nFrNzRfTVQdxzEw3b1b12-NuIBFkKWQLlQ4BB04FDA5 -e WORKING_DIRECTORY=/tmp --name runner-asset-manager docker-public.packages.atlassian.com/sox/atlassian/bitbucket-pipelines-runner --restart=always