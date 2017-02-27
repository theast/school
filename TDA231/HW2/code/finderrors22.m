function [ errors ] = finderrors22( p, mu1, mu2, offset )

errors = 0;

for i = 1:offset
    Ytest = new_classifier(p(i,:), mu1, mu2);
    if(Ytest == -1)
        errors = errors + 1;
    end
    Ytest = new_classifier(p(i+offset,:), mu1, mu2);
    if(Ytest == 1)
        errors = errors + 1;
    end
end

end

