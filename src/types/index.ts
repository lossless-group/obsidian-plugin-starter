import { PluginSettingTab } from 'obsidian';
import { Plugin } from 'obsidian';

export interface PluginSettings {
  apiKey: string;
  baseUrl: string;
  retries: number;
  backoffDelay: number;
  rateLimit: number;
  cacheDuration: number;
}

export interface OpenGraphData {
  title: string;
  description: string;
  image: string | null;
  url: string;
  type: string;
  site_name: string;
  error?: string;
}

export interface OpenGraphPlugin extends Plugin {
  settings: PluginSettings;
}

export interface OpenGraphPluginSettingsTab extends PluginSettingTab {
  plugin: OpenGraphPlugin;
}
