import React from "react";
import { Button } from "@/components/ui/button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { Undo, Trash2, Plus, CornerDownLeft } from "lucide-react";

export const ButtonPreview: React.FC = () => {
    return (
        <div className="min-h-screen bg-background text-foreground p-10 space-y-12">
            <h1 className="text-3xl font-bold mb-8">Design System: Buttons</h1>

            {/* Primary Button */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Primary Button</h2>
                <div className="flex flex-wrap gap-4 items-center">
                    <PrimaryButton>Default Action</PrimaryButton>
                    <PrimaryButton disabled>Disabled</PrimaryButton>
                    <PrimaryButton className="w-full max-w-[200px]">Full Width</PrimaryButton>
                </div>
            </section>

            {/* Secondary Button */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Secondary Button</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Default Variant */}
                    <div className="space-y-2">
                        <h3 className="text-sm text-muted-foreground uppercase">Variant: Default (White)</h3>
                        <div className="flex flex-wrap gap-4 items-start">
                            <SecondaryButton>Text Only</SecondaryButton>
                            <SecondaryButton><Undo className="w-4 h-4" /> Icon + Text</SecondaryButton>
                            <SecondaryButton size="icon" title="Icon Only"><Undo className="w-4 h-4" /></SecondaryButton>
                            <SecondaryButton className="h-9 w-9 px-0" title="Manual Size"><Undo className="w-4 h-4" /></SecondaryButton>
                        </div>
                    </div>

                    {/* Success Variant */}
                    <div className="space-y-2">
                        <h3 className="text-sm text-muted-foreground uppercase text-emerald-500">Variant: Success</h3>
                        <div className="flex flex-wrap gap-4 items-start">
                            <SecondaryButton variant="success">Approve</SecondaryButton>
                            <SecondaryButton variant="success"><CornerDownLeft className="w-4 h-4" /> Submit</SecondaryButton>
                            <SecondaryButton variant="success" size="icon"><CornerDownLeft className="w-4 h-4" /></SecondaryButton>
                            <SecondaryButton variant="success" className="h-9 w-9 px-0"><CornerDownLeft className="w-4 h-4" /></SecondaryButton>
                        </div>
                    </div>

                    {/* Destructive Variant */}
                    <div className="space-y-2">
                        <h3 className="text-sm text-muted-foreground uppercase text-destructive">Variant: Destructive</h3>
                        <div className="flex flex-wrap gap-4 items-start">
                            <SecondaryButton variant="destructive">Delete</SecondaryButton>
                            <SecondaryButton variant="destructive"><Trash2 className="w-4 h-4" /> Remove</SecondaryButton>
                            <SecondaryButton variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></SecondaryButton>
                        </div>
                    </div>
                </div>
            </section>

            {/* Native Button (Ghost) */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Ghost (Native Button)</h2>
                <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="ghost">Ghost Default</Button>
                    <Button variant="ghost" size="sm">Ghost Small</Button>
                    <Button variant="ghost" size="icon"><Plus className="w-4 h-4" /></Button>
                </div>
            </section>

            {/* Sizing Comparison */}
            <section className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Sizing Check (Pixel Perfect?)</h2>
                <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-lg border border-dashed border-white/10">
                    <div className="text-center">
                        <div className="mb-2 text-xs">Toolbar (Manual)</div>
                        <SecondaryButton className="h-9 w-9 px-0"><Undo className="w-4 h-4" /></SecondaryButton>
                    </div>
                    <div className="text-center">
                        <div className="mb-2 text-xs">Footer (Variant + Manual)</div>
                        <SecondaryButton variant="success" className="h-9 w-9 px-0"><CornerDownLeft className="w-4 h-4" /></SecondaryButton>
                    </div>
                    <div className="text-center">
                        <div className="mb-2 text-xs">Size="Icon" (Standard)</div>
                        <SecondaryButton variant="success" size="icon"><CornerDownLeft className="w-4 h-4" /></SecondaryButton>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">The "Manual" and "Icon" buttons should look identical if the system is working correctly. If "Icon" has extra padding, that explains the issue.</p>
            </section>
        </div>
    );
};
