default:
    just --list

install:
    bun install

# Unfortunately, this must be two separate commands because Next
# does not support alternate linters and there's some stuff in the 'lint'
# command that we find useful. See for more context:
# https://github.com/vercel/next.js/discussions/59347
lint:
    bun lint
    bun tsc

dev:
    bun dev

build:
    bun build