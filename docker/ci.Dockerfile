FROM node:24.22.3-bookworm-slim

ENV PATH="/root/.cargo/bin:${PATH}"

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    build-essential \
    ca-certificates \
    curl \
    dvisvgm \
    git \
    libssl-dev \
    perl \
    pkg-config \
    python3 \
    tar \
    texlive-extra-utils \
    texlive-pictures \
    texlive-plain-generic \
    zstd \
    && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --profile minimal \
    && cargo install monolith --version 2.11.7 --locked \
    && rm -rf /root/.cargo/registry /root/.cargo/git
