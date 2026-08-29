# Integration tests（N1 手动）

真实 DeepSeek/FNS 集成仅手动运行，不进入普通 CI。N1 使用 stock OpenClaw 编排，写入目标必须是 `Migration-Test/`，并在每次 create/update 后 read-back；没有已验证的 OpenClaw/FNS 运行时就保持 BLOCKED，不以占位输出冒充成功。
