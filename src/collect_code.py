import os

# ================= إعدادات السكريبت للباك إند (NestJS, Node, Docker) =================

output_filename = "backend_full_code_dump.txt"

# 1. الامتدادات البرمجية الشاملة
included_extensions = [
    # Logic & Languages
    '.ts', '.js', '.py', '.php', '.go', '.rs', '.java',
    
    # Config & Environment
    '.json', '.yaml', '.yml', '.env', '.env.example', '.toml',
    
    # Database & ORM
    '.sql', '.prisma', '.db', '.entity.ts', '.dto.ts', '.schema.ts',
    
    # Infrastructure & DevOps
    '.dockerignore', '.gitignore',
    
    # Documentation
    '.md', '.txt'
]

# 2. ملفات محددة بالاسم (Files without unique extensions)
included_filenames = {
    'Dockerfile', 'docker-compose.yml', 'Caddyfile', 'Makefile', 
    'Procfile', 'nest-cli.json', 'tsconfig.json', 'package.json'
}

# 3. مجلدات يجب تجاهلها (عشان الكود ميطلعش ملايين السطور)
ignored_dirs = {
    'node_modules', 'dist', 'build', 'venv', '.git', '.idea', 
    '__pycache__', 'coverage', 'tmp', 'logs', 'uploads', 
    'migrations', '.next', 'out', 'bin', 'obj'
}

# ================= بداية التنفيذ =================

def collect_backend_files():
    print(f"🚀 Starting to aggregate Backend Code...")
    count = 0
    
    with open(output_filename, 'w', encoding='utf-8') as outfile:
        outfile.write(f"--- BACKEND PROJECT FULL DUMP ---\n")
        outfile.write(f"Generated on: 2026-02-07\n")
        outfile.write("="*60 + "\n\n")

        for root, dirs, files in os.walk("."):
            # (1) تصفية المجلدات المستبعدة
            dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith('.')]
            
            for file in files:
                # (2) تجاهل ملفات القفل (Lock files) لأنها طويلة جداً وغير مفيدة
                if 'lock' in file.lower():
                    continue
                
                # (3) التحقق من الامتداد أو اسم الملف
                is_target = any(file.endswith(ext) for ext in included_extensions) or file in included_filenames
                
                if is_target:
                    file_path = os.path.join(root, file)
                    
                    # تخطي ملف المخرج نفسه
                    if file == output_filename:
                        continue

                    print(f"📦 Adding: {file_path}")

                    outfile.write(f"\n{'#'*60}\n")
                    outfile.write(f"PATH: {file_path}\n")
                    outfile.write(f"{'#'*60}\n\n")

                    try:
                        # استخدام errors='ignore' لتخطي الرموز الغريبة في ملفات الـ binary إن وجدت
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as infile:
                            outfile.write(infile.read())
                            count += 1
                    except Exception as e:
                        outfile.write(f"\n[⚠️ Skipped due to error: {e}]\n")
                    
                    outfile.write(f"\n\n{'*'*20} END OF FILE {'*'*20}\n")

    print(f"\n✅ Success! {count} files were collected into: {output_filename}")

if __name__ == "__main__":
    collect_backend_files()