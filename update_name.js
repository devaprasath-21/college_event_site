const fs = require('fs');
const file = 'backend/src/controllers/auth.controller.ts';
let content = fs.readFileSync(file, 'utf8');

// completeProfile inputs
content = content.replace(/const \{ registrationNumber, department/g, 'const { name, registrationNumber, department');
content = content.replace(/if \(!registrationNumber \|\| !department/g, 'if (!name || !registrationNumber || !department');
content = content.replace(/message: 'Registration Number, Department/g, "message: 'Name, Registration Number, Department");
content = content.replace(/registrationNumber,(\r?\n\s+department)/g, 'name,\n          registrationNumber,$1');

// updateProfile inputs
content = content.replace(/const \{ username, registrationNumber/g, 'const { username, name, registrationNumber');
content = content.replace(/if \(!username \|\| !registrationNumber/g, 'if (!username || !name || !registrationNumber');
content = content.replace(/message: 'Username, Registration Number/g, "message: 'Username, Name, Registration Number");
content = content.replace(/username,(\r?\n\s+registrationNumber)/g, 'username,\n          name,$1');

// User response mapping
content = content.replace(/username: ([a-zA-Z0-9_]+)\.username,/g, 'username: $1.username,\n        name: $1.name || "",');

fs.writeFileSync(file, content, 'utf8');

// Also update AuthContext.tsx
const authContextFile = 'frontend/src/context/AuthContext.tsx';
let authContent = fs.readFileSync(authContextFile, 'utf8');

authContent = authContent.replace(/username: string;/g, "username: string;\n  name?: string;");
authContent = authContent.replace(/registrationNumber: string;/g, "name: string;\n    registrationNumber: string;");

fs.writeFileSync(authContextFile, authContent, 'utf8');

// Also update LoginPage.tsx
const loginPageFile = 'frontend/src/pages/LoginPage.tsx';
let loginContent = fs.readFileSync(loginPageFile, 'utf8');

// Add const [name, setName] = useState('');
loginContent = loginContent.replace(/const \[registerUsername, setRegisterUsername\] = useState\(''\);/, "const [registerUsername, setRegisterUsername] = useState('');\n  const [name, setName] = useState('');");

// In handleCompleteProfile, pass name
loginContent = loginContent.replace(/await completeProfile\(\{/g, "await completeProfile({\n        name,");

// Add the UI field for name right after username in the form
const nameFieldHtml = `
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground/80">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full bg-background/50 border border-muted focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2 text-sm text-foreground transition-all outline-none"
                        placeholder="e.g. Aditya Sharma"
                      />
                    </div>`;

// Find where username field is (which is rendered readOnly in complete profile step).
// Wait, in complete profile, is there a username field?
// In the user's screenshot, I see: Username, College Email, Registration Number, Department, Academic Year, Section, Contact Phone
// Let's just insert it after the Username block.
loginContent = loginContent.replace(/(<label className="text-xs font-semibold text-foreground\/80">Username<\/label>\s*<input[^>]+>\s*<\/div>)/, `$1${nameFieldHtml}`);

fs.writeFileSync(loginPageFile, loginContent, 'utf8');

console.log('files updated');
