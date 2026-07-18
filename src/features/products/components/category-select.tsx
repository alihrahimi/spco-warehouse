"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FormField, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { createCategoryAction, getCategoriesAction } from "@/features/products/actions";

export interface CategorySelectProps {
  value: string;
  onChange: (categoryId: string) => void;
  invalid?: boolean;
}

/**
 * SCREEN-SPECS.md's documented plan for category management: folded into
 * this one small "add new" affordance rather than a dedicated CRUD module,
 * since Phase 12 never asked for full category management — just enough
 * to bootstrap and grow the list as products are created.
 */
export function CategorySelect({ value, onChange, invalid }: CategorySelectProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["products", "categories"],
    queryFn: async () => {
      const result = await getCategoriesAction();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  async function handleCreateCategory() {
    if (newCategoryName.trim().length < 2) {
      toast.error("نام دسته‌بندی را وارد کنید");
      return;
    }
    setIsSubmitting(true);
    const result = await createCategoryAction({ name: newCategoryName });
    setIsSubmitting(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("دسته‌بندی ثبت شد");
    queryClient.invalidateQueries({ queryKey: ["products", "categories"] });
    onChange(result.data.id);
    setNewCategoryName("");
    setDialogOpen(false);
  }

  const options = (categories ?? []).map((category) => ({ value: category.id, label: category.name }));

  return (
    <>
      <div className="flex items-center gap-2">
        <Select options={options} value={value} onValueChange={onChange} invalid={invalid} className="flex-1" />
        <Button type="button" variant="outline" size="icon" aria-label="دسته‌بندی جدید" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>دسته‌بندی جدید</DialogTitle>
          <div className="mt-4 flex flex-col gap-4">
            <FormField label="نام دسته‌بندی" htmlFor="new-category-name">
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="مثال: بادی‌ها"
              />
            </FormField>
            <div className="flex flex-row-reverse gap-3">
              <Button type="button" loading={isSubmitting} onClick={handleCreateCategory}>
                ذخیره
              </Button>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                انصراف
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
