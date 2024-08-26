'use client'
import * as React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const TagSelector = ({ options, onSelectTags }) => {
  const [selectedTags, setSelectedTags] = React.useState([]);

  const handleTagChange = (tag) => {
    const isSelected = selectedTags.includes(tag);
    const newTags = isSelected
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);
    onSelectTags(newTags);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Select Tags</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col space-y-2">
          {options.map((option) => (
            <label key={option.value} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedTags.includes(option.value)}
                onCheckedChange={() => handleTagChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default TagSelector;
