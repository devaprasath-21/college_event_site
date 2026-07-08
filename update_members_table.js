const fs = require('fs');
const file = 'frontend/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add deleteMemberMutation
const mutationTarget = `  const deleteCoordinatorMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(\`/auth/coordinators/\${id}\`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coordinators'] });
    }
  });`;

const mutationReplacement = `  const deleteCoordinatorMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(\`/auth/coordinators/\${id}\`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coordinators'] });
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(\`/auth/members/\${id}\`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      alert('Member account deleted successfully.');
    }
  });`;

content = content.replace(mutationTarget, mutationReplacement);

// 2. Replace Members Table
const tableTarget = `              {/* Members Table */}
              <div className="border border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-white/5 font-bold text-muted-foreground">
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Registration No</th>
                        <th className="p-4">Department</th>
                        <th className="p-4 text-center">Year/Sec</th>
                        <th className="p-4 text-center">XP Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const filteredMembers = allMembers?.filter((m: any) => 
                          memberYearFilter === '' ? true : (m.year && m.year.startsWith(memberYearFilter))
                        );
                        
                        if (membersLoading) {
                          return <tr><td colSpan={6} className="p-6 text-center text-muted-foreground"><Loader /></td></tr>;
                        }
                        if (!filteredMembers || filteredMembers.length === 0) {
                          return <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No registered members found for this year.</td></tr>;
                        }
                        
                        return filteredMembers.map((member: any) => (
                          <tr key={member.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4 font-bold text-foreground">{member.username}</td>
                            <td className="p-4 text-muted-foreground">{member.email}</td>
                            <td className="p-4 font-mono">{member.registrationNumber || <span className="italic text-muted-foreground">Not set</span>}</td>
                            <td className="p-4 text-foreground">{member.department || '—'}</td>
                            <td className="p-4 text-center font-bold">
                              {member.year ? \`\${member.year} / \${member.section}\` : '—'}
                            </td>
                            <td className="p-4 text-center text-secondary font-bold">
                              {member.participationPoints} XP
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>`;

const tableReplacement = `              {/* Members Table */}
              <div className="border border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/30 border-b border-white/5 font-bold text-muted-foreground">
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Registration No</th>
                        <th className="p-4">Department</th>
                        <th className="p-4 text-center">Year/Sec</th>
                        <th className="p-4 text-center">XP Points</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(() => {
                        const filteredMembers = allMembers?.filter((m: any) => 
                          memberYearFilter === '' ? true : (m.year && m.year.startsWith(memberYearFilter))
                        );
                        
                        if (membersLoading) {
                          return <tr><td colSpan={7} className="p-6 text-center text-muted-foreground"><Loader /></td></tr>;
                        }
                        if (!filteredMembers || filteredMembers.length === 0) {
                          return <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No registered members found for this year.</td></tr>;
                        }
                        
                        return filteredMembers.map((member: any) => (
                          <tr key={member.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-foreground">{member.name || member.username}</p>
                              <p className="text-muted-foreground">@{member.username}</p>
                            </td>
                            <td className="p-4 text-muted-foreground">{member.email}</td>
                            <td className="p-4 font-mono">{member.registrationNumber || <span className="italic text-muted-foreground">Not set</span>}</td>
                            <td className="p-4 text-foreground">{member.department || '—'}</td>
                            <td className="p-4 text-center font-bold">
                              {member.year ? \`\${member.year} / \${member.section}\` : '—'}
                            </td>
                            <td className="p-4 text-center text-secondary font-bold">
                              {member.participationPoints} XP
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  if(window.confirm(\`Are you sure you want to permanently delete the account for \${member.name || member.username}?\`)) {
                                    deleteMemberMutation.mutate(member.id);
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all border border-red-500/20 clickable"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>`;

content = content.replace(tableTarget, tableReplacement);
fs.writeFileSync(file, content, 'utf8');
