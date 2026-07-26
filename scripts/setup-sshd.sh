#!/usr/bin/env bash
set -euo pipefail

apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openssh-server
systemctl enable --now ssh

SSHD_CONFIG=/etc/ssh/sshd_config
if ! grep -q '^PubkeyAuthentication' "$SSHD_CONFIG"; then
  echo 'PubkeyAuthentication yes' >> "$SSHD_CONFIG"
fi
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' "$SSHD_CONFIG" || true
sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSHD_CONFIG" || true

systemctl restart ssh
systemctl --no-pager --full status ssh | head -15
ss -tlnp | grep ':22 ' || true
echo "SSH server pronto."
