require "sanitize"

class Helpers
    def self.clean(input)
        return Sanitize.fragment(input)
            .downcase
            .gsub(/\s+/, "-")
            .gsub(/^([A-Za-z0-9\-_.:]+).*?$/, "\\1")
            .gsub(/^\./, "")
            .gsub(/\.$/, "")
            .gsub(/[^A-Za-z0-9\-_.]/, "")
            .sub(/^-+/, "")
            .sub(/-+$/, "")

    end
end
