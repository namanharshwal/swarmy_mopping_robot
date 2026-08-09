#!/bin/bash
curl -sS -N --request POST --url "https://integrate.api.nvidia.com/v1/chat/completions" \
  --header "Authorization: Bearer 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" \
  --header "Accept: text/event-stream" \
  --header "Content-Type: application/json" \
  --data '{"model":"google/gemma-4-31b-it","messages":[{"role":"user","content":"Hello"}],"stream":true,"max_tokens":20}'
