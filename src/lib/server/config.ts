import fs from 'fs';
import path from 'path';
import os from 'os';

export interface BasaltConfig {
	vaultPath: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.config', 'basalt');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');
const DEFAULT_VAULT_PATH = path.join(os.homedir(), 'Documents', 'Basalt');

export function configExists(): boolean {
	return fs.existsSync(CONFIG_PATH);
}

export function getConfig(): BasaltConfig {
	const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
	return JSON.parse(raw) as BasaltConfig;
}

export function writeConfig(config: BasaltConfig): void {
	fs.mkdirSync(CONFIG_DIR, { recursive: true });
	fs.mkdirSync(config.vaultPath, { recursive: true });
	fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export { DEFAULT_VAULT_PATH };
