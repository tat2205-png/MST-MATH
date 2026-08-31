# BẮT ĐẦU — Math Workflow Studio V3.0 Agency Agents Edition

## A. Nếu chỉ muốn chạy app
Mở `index.html` bằng Live Server hoặc deploy lên GitHub Pages. Phần chính vẫn là:
1. Đầu vào
2. Lựa chọn
3. Đầu ra

## B. Nếu muốn phát triển app bằng Agency Agents
1. Cài Agency Agents chính thức.
2. Cài các division: engineering, design, product, project-management, testing, security, specialized vào Codex/Cursor/Claude Code/Gemini CLI.
3. Mở thư mục dự án.
4. Yêu cầu AI đọc `AGENTS.md`.
5. Bắt đầu bằng Agents Orchestrator.

Prompt khởi động:

`Use the Agents Orchestrator for Math Workflow Studio. Read AGENTS.md and AGENCY_TEAM.md. Turn my request into Agency tasks, assign lead/review agents, enforce G2/G5/G6, and do not release without Reality Checker evidence.`

## C. Các file cần đọc theo thứ tự
1. `AGENTS.md`
2. `AGENCY_TEAM.md`
3. `agency/manifest.json`
4. `agency/workflows/DEVELOPMENT_PIPELINE.md`
5. `WORKFLOW_BACKEND_PROMPT.md`
6. `SUPABASE_SETUP.md`

## D. Agent toán học riêng
Nằm trong `agency/roles/`. Đây là lớp nghiệp vụ bắt buộc để Agency Agents không xử lý Toán/GDPT như một app SaaS chung chung.
