workflow "build and test" {
  on = "push"
  resolves = "test:coverage"
}

action "prepare" {
  uses = "docker://alpine/git"
  args = ["submodule", "update", "--init", "--recursive"]
}

action "test" {
  needs = ["prepare"]
  uses = "eirslett/chrome-karma-docker/docker/dev@master"
  runs = ["node --expose-gc tools/test.js"]
}
