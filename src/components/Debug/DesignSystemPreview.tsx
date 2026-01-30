import React from "react";
import { Button } from "@/components/ui/button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { Input } from "@/components/ui/input";
import { GradientInput } from "@/components/ui/gradient-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Undo, Trash2, Plus, CornerDownLeft, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BooleanBadge } from "@/components/ui/BooleanBadge";
import { ObjectBadge } from "@/components/ui/object-badge";
import { ShortcutBadge } from "@/components/ui/shortcut-badge";
import { ArrayBadge } from "@/components/ui/array-badge";

export const DesignSystemPreview: React.FC = () => {
    return (
        <div className="min-h-screen bg-background text-foreground p-10 space-y-16 max-w-7xl mx-auto">
            <header className="border-b pb-6">
                <h1 className="text-4xl font-bold tracking-tight">Design System</h1>
                <p className="text-muted-foreground mt-2">Core components, typography, and tokens.</p>
            </header>

            {/* Typography */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2 flex items-center gap-2">
                    <span className="text-muted-foreground text-lg">01.</span> Typography
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Main Title (H1)</p>
                            <h1 className="text-4xl font-bold tracking-tight">The quick brown fox jumps</h1>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Section Title (H2)</p>
                            <h2 className="text-3xl font-semibold tracking-tight">The quick brown fox jumps</h2>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Card Title (H3)</p>
                            <h3 className="text-2xl font-semibold tracking-tight">The quick brown fox jumps</h3>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Body Large</p>
                            <p className="text-lg text-muted-foreground">The quick brown fox jumps over the lazy dog.</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Body Default</p>
                            <p className="leading-7">The quick brown fox jumps over the lazy dog.</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Small / Muted</p>
                            <p className="text-sm text-muted-foreground">The quick brown fox jumps over the lazy dog.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Colors */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2 flex items-center gap-2">
                    <span className="text-muted-foreground text-lg">02.</span> Colors
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                        <div className="h-16 w-full rounded-lg bg-background border"></div>
                        <p className="text-xs font-mono">bg-background</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-16 w-full rounded-lg bg-card border"></div>
                        <p className="text-xs font-mono">bg-card</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-16 w-full rounded-lg bg-popover border"></div>
                        <p className="text-xs font-mono">bg-popover</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-16 w-full rounded-lg bg-primary"></div>
                        <p className="text-xs font-mono">bg-primary</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-16 w-full rounded-lg bg-secondary"></div>
                        <p className="text-xs font-mono">bg-secondary</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-16 w-full rounded-lg bg-muted"></div>
                        <p className="text-xs font-mono">bg-muted</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-16 w-full rounded-lg bg-destructive"></div>
                        <p className="text-xs font-mono">bg-destructive</p>
                    </div>
                    <div className="space-y-2">
                        <div className="h-16 w-full rounded-lg bg-border"></div>
                        <p className="text-xs font-mono">bg-border</p>
                    </div>
                </div>
            </section>

            {/* Badges */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2 flex items-center gap-2">
                    <span className="text-muted-foreground text-lg">03.</span> Badges
                </h2>
                <div className="space-y-8">
                    {/* Badge Variants */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase">Badge Variants</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Badge variant="success">Success</Badge>
                            <Badge variant="error">Error</Badge>
                            <Badge variant="warning">Warning</Badge>
                            <Badge variant="info">Info</Badge>
                        </div>
                    </div>
                    {/* Specialized Badges */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase">Data Type Badges</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase">Boolean (True)</span>
                                <BooleanBadge value={true} />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase">Boolean (False)</span>
                                <BooleanBadge value={false} />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase">Object</span>
                                <ObjectBadge keys={["id", "name", "status"]} onClick={() => { }} />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase">Array</span>
                                <ArrayBadge length={5} onClick={() => { }} />
                            </div>
                        </div>
                    </div>
                    {/* Keyboard Shortcuts */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase">Keyboard Shortcuts</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase">Small</span>
                                <div className="flex items-center gap-1">
                                    <ShortcutBadge variant="small">⌘</ShortcutBadge>
                                    <ShortcutBadge variant="small">K</ShortcutBadge>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase">Arrow Keys</span>
                                <div className="flex items-center gap-1">
                                    <ShortcutBadge variant="small">↑</ShortcutBadge>
                                    <ShortcutBadge variant="small">↓</ShortcutBadge>
                                    <ShortcutBadge variant="small">←</ShortcutBadge>
                                    <ShortcutBadge variant="small">→</ShortcutBadge>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-muted-foreground uppercase">Special Keys</span>
                                <div className="flex items-center gap-1">
                                    <ShortcutBadge variant="small">⏎</ShortcutBadge>
                                    <ShortcutBadge variant="small">⌫</ShortcutBadge>
                                    <ShortcutBadge variant="small">⎋</ShortcutBadge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Inputs & Forms */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2 flex items-center gap-2">
                    <span className="text-muted-foreground text-lg">04.</span> Inputs (36px, 8px Radius)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase">Text Input</h3>
                        <div className="space-y-2">
                            <Label>Default</Label>
                            <Input placeholder="Placeholder text..." />
                        </div>
                        <div className="space-y-2">
                            <Label>With Value</Label>
                            <Input defaultValue="Stored value" />
                        </div>
                        <div className="space-y-2">
                            <Label>Disabled</Label>
                            <Input disabled placeholder="Cannot type here" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase">Gradient Input (Custom)</h3>
                        <div className="space-y-2">
                            <Label>Default</Label>
                            <GradientInput placeholder="Fancy input..." />
                        </div>
                        <div className="space-y-2">
                            <Label>With Error</Label>
                            <GradientInput error defaultValue="Invalid input" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-medium text-sm text-muted-foreground uppercase">Select</h3>
                        <div className="space-y-2">
                            <Label>Default</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="opt1">Option 1</SelectItem>
                                    <SelectItem value="opt2">Option 2</SelectItem>
                                    <SelectItem value="opt3">Option 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>With Value</Label>
                            <Select defaultValue="opt2">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="opt1">Option 1</SelectItem>
                                    <SelectItem value="opt2">Option 2</SelectItem>
                                    <SelectItem value="opt3">Option 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </section>

            {/* Buttons */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2 flex items-center gap-2">
                    <span className="text-muted-foreground text-lg">05.</span> Buttons (36px, 8px Radius)
                </h2>

                <div className="space-y-8">
                    {/* Primary Button */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase">Primary</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <PrimaryButton>Primary Action</PrimaryButton>
                            <PrimaryButton disabled>Disabled</PrimaryButton>
                            <PrimaryButton><Plus className="w-4 h-4 mr-2" />With Icon</PrimaryButton>
                        </div>
                    </div>

                    {/* Secondary Button */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase">Secondary (Default)</h3>
                            <div className="flex flex-wrap gap-4 items-center">
                                <SecondaryButton>Secondary</SecondaryButton>
                                <SecondaryButton><Undo className="w-4 h-4" /> Icon</SecondaryButton>
                                <SecondaryButton size="icon"><Undo className="w-4 h-4" /></SecondaryButton>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-emerald-500 uppercase">Secondary (Success)</h3>
                            <div className="flex flex-wrap gap-4 items-center">
                                <SecondaryButton variant="success">Success</SecondaryButton>
                                <SecondaryButton variant="success"><CornerDownLeft className="w-4 h-4" /> Save</SecondaryButton>
                                <SecondaryButton variant="success" size="icon"><CornerDownLeft className="w-4 h-4" /></SecondaryButton>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-destructive uppercase">Secondary (Destructive)</h3>
                            <div className="flex flex-wrap gap-4 items-center">
                                <SecondaryButton variant="destructive">Delete</SecondaryButton>
                                <SecondaryButton variant="destructive"><Trash2 className="w-4 h-4" /> Remove</SecondaryButton>
                                <SecondaryButton variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></SecondaryButton>
                            </div>
                        </div>
                    </div>

                    {/* Sizing Comparison */}
                    <div className="space-y-4 pt-4 border-t border-dashed">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase">Helper Sizes</h3>
                        <div className="flex flex-wrap gap-6 items-end">
                            <div className="space-y-2 text-center">
                                <span className="text-[10px] uppercase text-muted-foreground">Small (h-8)</span>
                                <div><PrimaryButton size="sm">Action</PrimaryButton></div>
                            </div>
                            <div className="space-y-2 text-center">
                                <span className="text-[10px] uppercase text-muted-foreground">Default (h-9)</span>
                                <div><PrimaryButton size="default">Action</PrimaryButton></div>
                            </div>
                            <div className="space-y-2 text-center">
                                <span className="text-[10px] uppercase text-muted-foreground">Large (h-11)</span>
                                <div><PrimaryButton size="lg">Action</PrimaryButton></div>
                            </div>
                            <div className="space-y-2 text-center">
                                <span className="text-[10px] uppercase text-muted-foreground">XL / Hero (h-14)</span>
                                {/* @ts-ignore - XL is valid but TS might lag */}
                                <div><PrimaryButton size="xl">Start Action</PrimaryButton></div>
                            </div>
                        </div>
                    </div>

                    {/* Ghost Button */}
                    <div className="space-y-4 pt-4 border-t border-dashed">
                        <h3 className="text-sm font-medium text-muted-foreground uppercase">Ghost (Native)</h3>
                        <div className="flex flex-wrap gap-4 items-center">
                            <Button variant="ghost">Ghost Default</Button>
                            <Button variant="ghost" size="sm">Ghost Small</Button>
                            <Button variant="ghost" size="icon"><Plus className="w-4 h-4" /></Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Validation */}
            <section className="border-t pt-8 mt-12">
                <div className="bg-muted/30 p-6 rounded-xl border border-dashed border-primary/20">
                    <h3 className="text-lg font-semibold mb-4">Height Validation (36px)</h3>
                    <p className="text-sm text-muted-foreground mb-6">All interactive elements in the toolbar and footer ecosystem must align perfectly.</p>

                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Button</span>
                            <SecondaryButton>Button</SecondaryButton>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Input</span>
                            <Input placeholder="Input" className="w-[120px]" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Select</span>
                            <Select>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                            </Select>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Icon Btn</span>
                            <SecondaryButton size="icon"><Search className="w-4 h-4" /></SecondaryButton>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
