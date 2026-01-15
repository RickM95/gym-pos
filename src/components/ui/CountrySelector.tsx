"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface Country {
    code: string;
    name: string;
    dialCode: string;
    flag: string;
}

const countries: Country[] = [
    { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
    { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
    { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
    { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
    { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
    { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
    { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
    { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
    { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
    { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
    { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
    { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱" },
    { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴" },
    { code: "PE", name: "Peru", dialCode: "+51", flag: "🇵🇪" },
    { code: "VE", name: "Venezuela", dialCode: "+58", flag: "🇻🇪" },
    { code: "HN", name: "Honduras", dialCode: "+504", flag: "🇭🇳" },
    { code: "GT", name: "Guatemala", dialCode: "+502", flag: "🇬🇹" },
    { code: "CR", name: "Costa Rica", dialCode: "+506", flag: "🇨🇷" },
    { code: "PA", name: "Panama", dialCode: "+507", flag: "🇵🇦" },
    { code: "SV", name: "El Salvador", dialCode: "+503", flag: "🇸🇻" },
    { code: "NI", name: "Nicaragua", dialCode: "+505", flag: "🇳🇮" },
    { code: "BO", name: "Bolivia", dialCode: "+591", flag: "🇧🇴" },
    { code: "PY", name: "Paraguay", dialCode: "+595", flag: "🇵🇾" },
    { code: "UY", name: "Uruguay", dialCode: "+598", flag: "🇺🇺" },
    { code: "EC", name: "Ecuador", dialCode: "+593", flag: "🇪🇨" },
    { code: "DO", name: "Dominican Republic", dialCode: "+1 809", flag: "🇩🇴" },
    { code: "JM", name: "Jamaica", dialCode: "+1 876", flag: "🇯🇲" },
    { code: "TT", name: "Trinidad and Tobago", dialCode: "+1 868", flag: "🇹🇹" },
    { code: "BB", name: "Barbados", dialCode: "+1 246", flag: "🇧🇧" },
    { code: "BS", name: "Bahamas", dialCode: "+1 242", flag: "🇧🇸" },
    { code: "GD", name: "Grenada", dialCode: "+1 473", flag: "🇬🇩" },
    { code: "AG", name: "Antigua and Barbuda", dialCode: "+1 268", flag: "🇦🇬" },
    { code: "KN", name: "St. Kitts and Nevis", dialCode: "+1 869", flag: "🇰🇳" },
    { code: "LC", name: "St. Lucia", dialCode: "+1 758", flag: "🇱🇨" },
    { code: "VC", name: "St. Vincent & the Grenadines", dialCode: "+1 784", flag: "🇻🇨" },
    { code: "CU", name: "Cuba", dialCode: "+53", flag: "🇨🇺" },
    { code: "HT", name: "Haiti", dialCode: "+509", flag: "🇭🇹" },
    { code: "PR", name: "Puerto Rico", dialCode: "+1 787", flag: "🇵🇷" },
    { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
    { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
    { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
    { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
    { code: "RU", name: "Russia", dialCode: "+7", flag: "🇷🇺" },
    { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
    { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
    { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
    { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
    { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
    { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
    { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
    { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
    { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
    { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
    { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪" },
    { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
    { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹" },
    { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪" },
    { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴" },
    { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰" },
    { code: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮" },
    { code: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱" },
    { code: "CZ", name: "Czech Republic", dialCode: "+420", flag: "🇨🇿" },
    { code: "HU", name: "Hungary", dialCode: "+36", flag: "🇭🇺" },
    { code: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷" },
    { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
    { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪" },
    { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷" },
    { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱" },
    { code: "AE", name: "United Arab Emirates", dialCode: "+971", flag: "🇦🇪" },
    { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
    { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
    { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩" },
    { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰" },
    { code: "MM", name: "Myanmar", dialCode: "+95", flag: "🇲🇲" },
    { code: "KH", name: "Cambodia", dialCode: "+855", flag: "🇰🇭" },
    { code: "LA", name: "Laos", dialCode: "+856", flag: "🇱🇦" },
    { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳" },
    { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿" },
    { code: "FJ", name: "Fiji", dialCode: "+679", flag: "🇫🇯" },
    { code: "PG", name: "Papua New Guinea", dialCode: "+675", flag: "🇵🇬" },
    { code: "PW", name: "Palau", dialCode: "+680", flag: "🇵🇼" },
    { code: "GU", name: "Guam", dialCode: "+1 671", flag: "🇬🇺" },
    { code: "AF", name: "Afghanistan", dialCode: "+93", flag: "🇦🇫" },
    { code: "AL", name: "Albania", dialCode: "+355", flag: "🇦🇱" },
    { code: "DZ", name: "Algeria", dialCode: "+213", flag: "🇩🇿" },
    { code: "AS", name: "American Samoa", dialCode: "+1 684", flag: "🇦🇸" },
    { code: "AD", name: "Andorra", dialCode: "+376", flag: "🇦🇩" },
    { code: "AO", name: "Angola", dialCode: "+244", flag: "🇦🇴" },
    { code: "AI", name: "Anguilla", dialCode: "+1 264", flag: "🇦🇮" },
    { code: "AM", name: "Armenia", dialCode: "+374", flag: "🇦🇲" },
    { code: "AW", name: "Aruba", dialCode: "+297", flag: "🇦🇼" },
    { code: "AZ", name: "Azerbaijan", dialCode: "+994", flag: "🇦🇿" },
    { code: "BH", name: "Bahrain", dialCode: "+973", flag: "🇧🇭" },
    { code: "BY", name: "Belarus", dialCode: "+375", flag: "🇧🇾" },
    { code: "BZ", name: "Belize", dialCode: "+501", flag: "🇧🇿" },
    { code: "BJ", name: "Benin", dialCode: "+229", flag: "🇧🇯" },
    { code: "BM", name: "Bermuda", dialCode: "+1 441", flag: "🇧🇲" },
    { code: "BT", name: "Bhutan", dialCode: "+975", flag: "🇧🇹" },
    { code: "BA", name: "Bosnia and Herzegovina", dialCode: "+387", flag: "🇧🇦" },
    { code: "BW", name: "Botswana", dialCode: "+267", flag: "🇧🇼" },
    { code: "BN", name: "Brunei", dialCode: "+673", flag: "🇧🇳" },
    { code: "BG", name: "Bulgaria", dialCode: "+359", flag: "🇧🇬" },
    { code: "BF", name: "Burkina Faso", dialCode: "+226", flag: "🇧🇫" },
    { code: "BI", name: "Burundi", dialCode: "+257", flag: "🇧🇮" },
    { code: "CV", name: "Cape Verde", dialCode: "+238", flag: "🇨🇻" },
    { code: "KY", name: "Cayman Islands", dialCode: "+ 345", flag: "🇰🇾" },
    { code: "CF", name: "Central African Republic", dialCode: "+236", flag: "🇨🇫" },
    { code: "TD", name: "Chad", dialCode: "+235", flag: "🇹🇩" },
    { code: "KM", name: "Comoros", dialCode: "+269", flag: "🇰🇲" },
    { code: "CG", name: "Congo", dialCode: "+242", flag: "🇨🇬" },
    { code: "CD", name: "Congo, Dem. Rep. of (Zaire)", dialCode: "+243", flag: "🇨🇩" },
    { code: "CK", name: "Cook Islands", dialCode: "+682", flag: "🇨🇰" },
    { code: "HR", name: "Croatia", dialCode: "+385", flag: "🇭🇷" },
    { code: "CW", name: "Curacao", dialCode: "+599", flag: "🇨🇼" },
    { code: "CY", name: "Cyprus", dialCode: "+537", flag: "🇨🇾" },
    { code: "DJ", name: "Djibouti", dialCode: "+253", flag: "🇩🇯" },
    { code: "DM", name: "Dominica", dialCode: "+1 767", flag: "🇩🇲" },
    { code: "TL", name: "East Timor", dialCode: "+670", flag: "🇹🇱" },
    { code: "GQ", name: "Equatorial Guinea", dialCode: "+240", flag: "🇬🇶" },
    { code: "ER", name: "Eritrea", dialCode: "+291", flag: "🇪🇷" },
    { code: "EE", name: "Estonia", dialCode: "+372", flag: "🇪🇪" },
    { code: "ET", name: "Ethiopia", dialCode: "+251", flag: "🇪🇹" },
    { code: "FK", name: "Falkland Islands", dialCode: "+500", flag: "🇫🇰" },
    { code: "FO", name: "Faroe Islands", dialCode: "+298", flag: "🇫🇴" },
    { code: "GF", name: "French Guiana", dialCode: "+594", flag: "🇬🇫" },
    { code: "PF", name: "French Polynesia", dialCode: "+689", flag: "🇵🇫" },
    { code: "GA", name: "Gabon", dialCode: "+241", flag: "🇬🇦" },
    { code: "GM", name: "Gambia", dialCode: "+220", flag: "🇬🇲" },
    { code: "GE", name: "Georgia", dialCode: "+995", flag: "🇬🇪" },
    { code: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭" },
    { code: "GI", name: "Gibraltar", dialCode: "+350", flag: "🇬🇮" },
    { code: "GL", name: "Greenland", dialCode: "+299", flag: "🇬🇱" },
    { code: "GP", name: "Guadeloupe", dialCode: "+590", flag: "🇬🇵" },
    { code: "GW", name: "Guinea", dialCode: "+224", flag: "🇬🇼" },
    { code: "GN", name: "Guinea-Bissau", dialCode: "+245", flag: "🇬🇳" },
    { code: "HK", name: "Hong Kong SAR China", dialCode: "+852", flag: "🇭🇰" },
    { code: "IS", name: "Iceland", dialCode: "+354", flag: "🇮🇸" },
    { code: "IR", name: "Iran", dialCode: "+98", flag: "🇮🇷" },
    { code: "IQ", name: "Iraq", dialCode: "+964", flag: "🇮🇶" },
    { code: "JO", name: "Jordan", dialCode: "+962", flag: "🇯🇴" },
    { code: "KZ", name: "Kazakhstan", dialCode: "+7 7", flag: "🇰🇿" },
    { code: "KI", name: "Kiribati", dialCode: "+686", flag: "🇰🇮" },
    { code: "KW", name: "Kuwait", dialCode: "+965", flag: "🇰🇼" },
    { code: "KG", name: "Kyrgyzstan", dialCode: "+996", flag: "🇰🇬" },
    { code: "LV", name: "Latvia", dialCode: "+371", flag: "🇱🇻" },
    { code: "LB", name: "Lebanon", dialCode: "+961", flag: "🇱🇧" },
    { code: "LS", name: "Lesotho", dialCode: "+266", flag: "🇱🇸" },
    { code: "LR", name: "Liberia", dialCode: "+231", flag: "🇱🇷" },
    { code: "LY", name: "Libya", dialCode: "+218", flag: "🇱🇾" },
    { code: "LI", name: "Liechtenstein", dialCode: "+423", flag: "🇱🇮" },
    { code: "LT", name: "Lithuania", dialCode: "+370", flag: "🇱🇹" },
    { code: "LU", name: "Luxembourg", dialCode: "+352", flag: "🇱🇺" },
    { code: "MO", name: "Macau SAR China", dialCode: "+853", flag: "🇲🇴" },
    { code: "MK", name: "Macedonia", dialCode: "+389", flag: "🇲🇰" },
    { code: "MG", name: "Madagascar", dialCode: "+261", flag: "🇲🇬" },
    { code: "MW", name: "Malawi", dialCode: "+265", flag: "🇲🇼" },
    { code: "MV", name: "Maldives", dialCode: "+960", flag: "🇲🇻" },
    { code: "ML", name: "Mali", dialCode: "+223", flag: "🇲🇱" },
    { code: "MT", name: "Malta", dialCode: "+356", flag: "🇲🇹" },
    { code: "MH", name: "Marshall Islands", dialCode: "+692", flag: "🇲🇭" },
    { code: "MQ", name: "Martinique", dialCode: "+596", flag: "🇲🇶" },
    { code: "MR", name: "Mauritania", dialCode: "+222", flag: "🇲🇷" },
    { code: "MU", name: "Mauritius", dialCode: "+230", flag: "🇲🇺" },
    { code: "YT", name: "Mayotte", dialCode: "+262", flag: "🇾🇹" },
    { code: "FM", name: "Micronesia", dialCode: "+691", flag: "🇫🇲" },
    { code: "MD", name: "Moldova", dialCode: "+373", flag: "🇲🇩" },
    { code: "MC", name: "Monaco", dialCode: "+377", flag: "🇲🇨" },
    { code: "MN", name: "Mongolia", dialCode: "+976", flag: "🇲🇳" },
    { code: "ME", name: "Montenegro", dialCode: "+382", flag: "🇲🇪" },
    { code: "MS", name: "Montserrat", dialCode: "+1664", flag: "🇲🇸" },
    { code: "MA", name: "Morocco", dialCode: "+212", flag: "🇲🇦" },
    { code: "NA", name: "Namibia", dialCode: "+264", flag: "🇳🇦" },
    { code: "NR", name: "Nauru", dialCode: "+674", flag: "🇳🇷" },
    { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵" },
    { code: "AN", name: "Netherlands Antilles", dialCode: "+599", flag: "🇳🇱" },
    { code: "NC", name: "New Caledonia", dialCode: "+687", flag: "🇳🇨" },
    { code: "NE", name: "Niger", dialCode: "+227", flag: "🇳🇪" },
    { code: "NU", name: "Niue", dialCode: "+683", flag: "🇳🇺" },
    { code: "NF", name: "Norfolk Island", dialCode: "+672", flag: "🇳🇫" },
    { code: "KP", name: "North Korea", dialCode: "+850", flag: "🇰🇵" },
    { code: "MP", name: "Northern Mariana Islands", dialCode: "+1 670", flag: "🇲🇵" },
    { code: "OM", name: "Oman", dialCode: "+968", flag: "🇴🇲" },
    { code: "PS", name: "Palestinian Territory", dialCode: "+970", flag: "🇵🇸" },
    { code: "QA", name: "Qatar", dialCode: "+974", flag: "🇶🇦" },
    { code: "RE", name: "Reunion", dialCode: "+262", flag: "🇷🇪" },
    { code: "RO", name: "Romania", dialCode: "+40", flag: "🇷🇴" },
    { code: "RW", name: "Rwanda", dialCode: "+250", flag: "🇷🇼" },
    { code: "WS", name: "Samoa", dialCode: "+685", flag: "🇼🇸" },
    { code: "SM", name: "San Marino", dialCode: "+378", flag: "🇸🇲" },
    { code: "SN", name: "Senegal", dialCode: "+221", flag: "🇸🇳" },
    { code: "RS", name: "Serbia", dialCode: "+381", flag: "🇷🇸" },
    { code: "SC", name: "Seychelles", dialCode: "+248", flag: "🇸🇨" },
    { code: "SL", name: "Sierra Leone", dialCode: "+232", flag: "🇸🇱" },
    { code: "SK", name: "Slovakia", dialCode: "+421", flag: "🇸🇰" },
    { code: "SI", name: "Slovenia", dialCode: "+386", flag: "🇸🇮" },
    { code: "SB", name: "Solomon Islands", dialCode: "+677", flag: "🇸🇧" },
    { code: "GS", name: "South Georgia and the South Sandwich Islands", dialCode: "+500", flag: "🇬🇸" },
    { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰" },
    { code: "SD", name: "Sudan", dialCode: "+249", flag: "🇸🇩" },
    { code: "SR", name: "Suriname", dialCode: "+597", flag: "🇸🇷" },
    { code: "SZ", name: "Swaziland", dialCode: "+268", flag: "🇸🇿" },
    { code: "SY", name: "Syria", dialCode: "+963", flag: "🇸🇾" },
    { code: "TW", name: "Taiwan", dialCode: "+886", flag: "🇹🇼" },
    { code: "TJ", name: "Tajikistan", dialCode: "+992", flag: "🇹🇯" },
    { code: "TZ", name: "Tanzania", dialCode: "+255", flag: "🇹🇿" },
    { code: "TL", name: "Timor Leste", dialCode: "+670", flag: "🇹🇱" },
    { code: "TG", name: "Togo", dialCode: "+228", flag: "🇹🇬" },
    { code: "TK", name: "Tokelau", dialCode: "+690", flag: "🇹🇰" },
    { code: "TO", name: "Tonga", dialCode: "+676", flag: "🇹🇴" },
    { code: "TN", name: "Tunisia", dialCode: "+216", flag: "🇹🇳" },
    { code: "TM", name: "Turkmenistan", dialCode: "+993", flag: "🇹🇲" },
    { code: "TC", name: "Turks and Caicos Islands", dialCode: "+1 649", flag: "🇹🇨" },
    { code: "TV", name: "Tuvalu", dialCode: "+688", flag: "🇹🇻" },
    { code: "VI", name: "U.S. Virgin Islands", dialCode: "+1 340", flag: "🇻🇮" },
    { code: "UG", name: "Uganda", dialCode: "+256", flag: "🇺🇬" },
    { code: "UA", name: "Ukraine", dialCode: "+380", flag: "🇺🇦" },
    { code: "UZ", name: "Uzbekistan", dialCode: "+998", flag: "🇺🇿" },
    { code: "VU", name: "Vanuatu", dialCode: "+678", flag: "🇻🇺" },
    { code: "WF", name: "Wallis and Futuna", dialCode: "+681", flag: "🇼🇫" },
    { code: "YE", name: "Yemen", dialCode: "+967", flag: "🇾🇪" },
    { code: "ZM", name: "Zambia", dialCode: "+260", flag: "🇿🇲" },
    { code: "ZW", name: "Zimbabwe", dialCode: "+263", flag: "🇿🇼" }
];

interface CountrySelectorProps {
    value: Country;
    onChange: (country: Country) => void;
    className?: string;
}

export function CountrySelector({ value, onChange, className = "" }: CountrySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCountries = countries.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.dialCode.includes(searchTerm)
    );

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl">{value.flag}</span>
                    <span>{value.dialCode}</span>
                </div>
                <ChevronDown size={20} className="text-gray-400" />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-3 border-b border-gray-700">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    ref={searchInputRef}
                    type="text"
                    className="w-full bg-gray-900 border-0 border-gray-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                    }}
                    placeholder="Search countries..."
                    autoComplete="off"
                    autoCorrect="off"
                />
                        </div>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto">
                        {filteredCountries.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">
                                No countries found
                            </div>
                        ) : (
                            filteredCountries.map((country) => (
                                <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => {
                                        onChange(country);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-700 flex items-center gap-3 text-white"
                                >
                                    <span className="text-lg">{country.flag}</span>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{country.name}</div>
                                        <div className="text-xs text-gray-400">{country.code} {country.dialCode}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper function to get country by code
const getCountryByCode = (code: string): Country | undefined => {
    return countries.find(c => c.code === code);
};

// Default to Honduras
export const defaultCountry: Country = countries.find(c => c.code === 'HN') || countries[0];