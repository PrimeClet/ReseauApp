module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', 'fix', 'docs', 'style', 'refactor',
        'perf', 'test', 'chore', 'ci', 'build', 'revert',
      ],
    ],
    'scope-enum': [
      1,
      'always',
      [
        'api', 'front', 'auth', 'coffret', 'equipement', 'port',
        'liaison', 'modification', 'cartography', 'import', 'user',
        'role', 'permission', 'lan', 'site', 'zone', 'batiment',
        'salle', 'maintenance', 'notification', 'system', 'metric',
        'activity-log', 'deps', 'config',
      ],
    ],
    'subject-max-length': [2, 'always', 100],
  },
};
